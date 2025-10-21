from __future__ import annotations

from collections.abc import Iterable
from typing import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.pagination import apply_datetime_cursor, slice_results
from ..models.clique import Clique, CliqueMember
from ..models.enums import MembershipStatus, Privacy, Role
from ..schemas.clique import CliqueCreate, CliqueUpdate


async def _load_occupations(
    db: AsyncSession, occupation_ids: Iterable[UUID | str]
) -> Sequence["Occupation"]:
    """Fetch occupation rows matching provided ids."""
    from ..models.user import Occupation

    if not occupation_ids:
        return []
    stmt = select(Occupation).where(Occupation.id.in_(list(occupation_ids)))
    result = await db.execute(stmt)
    return result.scalars().all()


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


async def join_clique(db: AsyncSession, user_id: str, clique_id: str) -> None:
    clique = await get_clique_by_id(db, clique_id)
    if not clique:
        raise ValueError("Clique not found")

    status = (
        MembershipStatus.PENDING
        if clique.privacy == Privacy.PRIVATE
        else MembershipStatus.JOINED
    )
    member = CliqueMember(
        user_id=user_id,
        clique_id=clique_id,
        role=Role.MEMBER,
        status=status,
    )
    db.add(member)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        # Already a member; treat as no-op.


async def leave_clique(db: AsyncSession, user_id: str, clique_id: str) -> None:
    stmt = select(CliqueMember).where(
        CliqueMember.user_id == user_id,
        CliqueMember.clique_id == clique_id,
    )
    member = await db.scalar(stmt)
    if member:
        await db.delete(member)
        await db.commit()


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


async def get_feed_posts(
    db: AsyncSession, user_id: str, cursor: str | None, limit: int
) -> tuple[list["Post"], str | None]:
    from ..models.post import Post
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

    for key, value in payload.items():
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
    await db.delete(clique)
    await db.commit()
