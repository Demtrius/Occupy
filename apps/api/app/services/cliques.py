from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime
from typing import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.clique import Clique, CliqueMember
from ..models.enums import MembershipStatus, Privacy, Role
from ..schemas.clique import CliqueCreate


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
):
    stmt = select(CliqueMember).where(
        CliqueMember.clique_id == clique_id,
        CliqueMember.status == MembershipStatus.JOINED,
    )
    if cursor:
        parsed_cursor = datetime.fromisoformat(cursor)
        stmt = stmt.where(CliqueMember.created_at < parsed_cursor)
    stmt = stmt.order_by(CliqueMember.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_feed_posts(
    db: AsyncSession, user_id: str, cursor: str | None, limit: int
):
    from ..models.post import Post

    followed_cliques_stmt = select(CliqueMember.clique_id).where(
        CliqueMember.user_id == user_id,
        CliqueMember.status == MembershipStatus.JOINED,
    )
    followed_clique_ids = await db.scalars(followed_cliques_stmt)
    followed_clique_ids = [cid for cid in followed_clique_ids]

    # Get posts from those cliques
    stmt = select(Post).where(Post.clique_id.in_(followed_clique_ids))
    if cursor:
        parsed_cursor = datetime.fromisoformat(cursor)
        stmt = stmt.where(Post.created_at < parsed_cursor)
    stmt = stmt.order_by(Post.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
