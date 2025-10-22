from __future__ import annotations

import secrets
from collections.abc import Iterable
from datetime import datetime, timezone
from typing import Any, Sequence
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.pagination import apply_datetime_cursor, slice_results
from ..models.clique import Clique, CliqueInvite, CliqueMember
from ..models.enums import MembershipStatus, Privacy, Role
from ..models.service import Service
from ..models.availability import Availability
from ..models.booking import Booking
from ..models.post import Post
from ..schemas.clique import Clique as CliqueSchema
from ..schemas.clique import CliqueCreate, CliqueInviteCreate, CliqueUpdate


async def _load_occupations(
    db: AsyncSession, occupation_ids: Iterable[UUID | str]
) -> Sequence["Occupation"]:
    from ..models.user import Occupation

    if not occupation_ids:
        return []
    stmt = select(Occupation).where(Occupation.id.in_(list(occupation_ids)))
    result = await db.execute(stmt)
    return result.scalars().all()


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def create_clique(
    db: AsyncSession,
    owner_user_id: str,
    data: CliqueCreate,
) -> Clique:
    clique = Clique(
        owner_user_id=owner_user_id,
        name=data.name,
        description=data.description,
        image_url=data.image_url,
        privacy=data.privacy,
        timezone=data.timezone,
        cancellation_cutoff_hours=data.cancellation_cutoff_hours,
    )
    db.add(clique)
    await db.flush()

    occupations = await _load_occupations(db, data.occupation_ids)
    for occupation in occupations:
        clique.occupations.append(occupation)

    owner_membership = CliqueMember(
        clique_id=clique.id,
        user_id=owner_user_id,
        role=Role.OWNER,
        status=MembershipStatus.JOINED,
    )
    db.add(owner_membership)

    await db.commit()
    await db.refresh(clique)
    return clique


async def get_clique_by_id(db: AsyncSession, clique_id: str) -> Clique | None:
    return await db.get(Clique, clique_id)


async def get_clique_public(
    db: AsyncSession, clique_id: str, requester_id: str | None
) -> dict[str, Any] | None:
    clique = await db.get(Clique, clique_id)
    if not clique:
        return None

    is_owner_or_member = False
    if requester_id:
        if str(clique.owner_user_id) == requester_id:
            is_owner_or_member = True
        else:
            membership = await db.scalar(
                select(CliqueMember).where(
                    CliqueMember.clique_id == clique_id,
                    CliqueMember.user_id == requester_id,
                    CliqueMember.status == MembershipStatus.JOINED,
                )
            )
            if membership:
                is_owner_or_member = True

    if clique.privacy == Privacy.PRIVATE and not is_owner_or_member:
        return {
            "id": str(clique.id),
            "name": clique.name,
            "description": clique.description,
            "privacy": clique.privacy.value,
            "image_url": clique.image_url,
            "timezone": clique.timezone,
        }

    full_view = CliqueSchema.model_validate(clique)
    return full_view.model_dump(mode="json")


async def join_clique(
    db: AsyncSession, user_id: str, clique_id: str, invite_token: str | None = None
) -> CliqueMember:
    clique = await get_clique_by_id(db, clique_id)
    if not clique:
        raise ValueError("Clique not found")

    invite: CliqueInvite | None = None
    if invite_token:
        invite = await db.scalar(
            select(CliqueInvite).where(
                CliqueInvite.clique_id == clique_id,
                CliqueInvite.token == invite_token,
            )
        )
        if not invite:
            raise ValueError("Invite token invalid")
        if invite.expires_at and invite.expires_at < _now():
            raise ValueError("Invite token expired")
        if invite.max_uses is not None and invite.uses >= invite.max_uses:
            raise ValueError("Invite token exhausted")

    existing = await db.scalar(
        select(CliqueMember).where(
            CliqueMember.clique_id == clique_id,
            CliqueMember.user_id == user_id,
        )
    )
    if existing:
        if invite and existing.status == MembershipStatus.PENDING:
            existing.status = MembershipStatus.JOINED
            invite.uses += 1
            await db.commit()
            await db.refresh(existing)
        return existing

    status = (
        MembershipStatus.PENDING
        if clique.privacy == Privacy.PRIVATE and not invite
        else MembershipStatus.JOINED
    )
    member = CliqueMember(
        user_id=user_id,
        clique_id=clique_id,
        role=Role.MEMBER,
        status=status,
    )
    db.add(member)
    if invite:
        invite.uses += 1
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise ValueError("Membership already exists") from None
    await db.refresh(member)
    return member


async def leave_clique(db: AsyncSession, user_id: str, clique_id: str) -> bool:
    stmt = select(CliqueMember).where(
        CliqueMember.user_id == user_id,
        CliqueMember.clique_id == clique_id,
        CliqueMember.role != Role.OWNER,
    )
    member = await db.scalar(stmt)
    if not member:
        return False
    await db.delete(member)
    await db.commit()
    return True


async def get_clique_members(
    db: AsyncSession, clique_id: str, cursor: str | None, limit: int
) -> tuple[list[CliqueMember], str | None]:
    stmt = select(CliqueMember).where(
        CliqueMember.clique_id == clique_id,
        CliqueMember.status == MembershipStatus.JOINED,
    )
    stmt = apply_datetime_cursor(stmt, CliqueMember, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return slice_results(rows, limit)


async def get_pending_members(
    db: AsyncSession, clique_id: str, cursor: str | None, limit: int
) -> tuple[list[CliqueMember], str | None]:
    stmt = select(CliqueMember).where(
        CliqueMember.clique_id == clique_id,
        CliqueMember.status == MembershipStatus.PENDING,
    )
    stmt = apply_datetime_cursor(stmt, CliqueMember, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return slice_results(rows, limit)


async def get_feed_posts(
    db: AsyncSession, user_id: str, cursor: str | None, limit: int
) -> tuple[list[Post], str | None]:
    from ..models.enums import PostStatus

    followed_cliques_stmt = select(CliqueMember.clique_id).where(
        CliqueMember.user_id == user_id,
        CliqueMember.status == MembershipStatus.JOINED,
    )
    followed_clique_ids = list(await db.scalars(followed_cliques_stmt))

    if not followed_clique_ids:
        return [], None

    stmt = select(Post).where(
        Post.clique_id.in_(followed_clique_ids),
        Post.status == PostStatus.POSTED,
        Post.deleted_at.is_(None),
    )
    stmt = apply_datetime_cursor(stmt, Post, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return slice_results(rows, limit)


async def is_member_of_clique(db: AsyncSession, clique_id: str, user_id: str) -> bool:
    stmt = select(CliqueMember).where(
        CliqueMember.clique_id == clique_id,
        CliqueMember.user_id == user_id,
        CliqueMember.status == MembershipStatus.JOINED,
    )
    member = await db.scalar(stmt)
    return member is not None


async def update_clique_details(
    db: AsyncSession,
    clique_id: str,
    data: CliqueUpdate,
) -> Clique:
    clique = await db.get(Clique, clique_id)
    if not clique:
        raise ValueError("Clique not found")

    payload = data.model_dump(exclude_unset=True)
    occupation_ids = payload.pop("occupation_ids", None)

    non_nullable_fields = {"name", "timezone"}
    for key, value in payload.items():
        if key in non_nullable_fields and value is None:
            raise ValueError(f"{key} cannot be empty")
        setattr(clique, key, value)

    if occupation_ids is not None:
        occupations = await _load_occupations(db, occupation_ids)
        clique.occupations = list(occupations)

    await db.commit()
    await db.refresh(clique)
    return clique


async def delete_clique(db: AsyncSession, clique_id: str) -> None:
    clique = await db.get(Clique, clique_id)
    if not clique:
        raise ValueError("Clique not found")

    await db.execute(delete(CliqueMember).where(CliqueMember.clique_id == clique_id))
    await db.execute(delete(CliqueInvite).where(CliqueInvite.clique_id == clique_id))
    await db.execute(delete(Service).where(Service.clique_id == clique_id))
    await db.execute(delete(Availability).where(Availability.clique_id == clique_id))
    await db.execute(delete(Booking).where(Booking.clique_id == clique_id))
    await db.execute(delete(Post).where(Post.clique_id == clique_id))

    await db.delete(clique)
    await db.commit()


async def approve_member(
    db: AsyncSession, clique_id: str, member_id: str
) -> CliqueMember:
    membership = await db.scalar(
        select(CliqueMember).where(
            CliqueMember.id == member_id,
            CliqueMember.clique_id == clique_id,
        )
    )
    if not membership:
        raise ValueError("Membership not found")
    if membership.status == MembershipStatus.JOINED:
        return membership
    if membership.status != MembershipStatus.PENDING:
        raise ValueError("Membership cannot be approved")
    membership.status = MembershipStatus.JOINED
    await db.commit()
    await db.refresh(membership)
    return membership


async def reject_member(db: AsyncSession, clique_id: str, member_id: str) -> None:
    membership = await db.scalar(
        select(CliqueMember).where(
            CliqueMember.id == member_id,
            CliqueMember.clique_id == clique_id,
        )
    )
    if not membership:
        return
    if membership.role == Role.OWNER:
        raise ValueError("Cannot remove clique owner")
    await db.delete(membership)
    await db.commit()


async def create_invite(
    db: AsyncSession,
    clique_id: str,
    data: CliqueInviteCreate,
) -> CliqueInvite:
    token = secrets.token_urlsafe(16)
    invite = CliqueInvite(
        clique_id=clique_id,
        token=token,
        expires_at=data.expires_at,
        max_uses=data.max_uses,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    return invite
