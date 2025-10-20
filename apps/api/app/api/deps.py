from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.auth import get_current_user, get_db
from ..models.clique import Clique, CliqueMember
from ..models.enums import MembershipStatus
from ..models.user import Follow, User


async def require_clique_owner(
    clique_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> None:
    clique = await db.get(Clique, clique_id)
    if not clique or clique.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not clique owner")


async def require_clique_member(
    clique_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> None:
    stmt = select(CliqueMember).where(
        CliqueMember.clique_id == clique_id,
        CliqueMember.user_id == current_user.id,
        CliqueMember.status == MembershipStatus.JOINED,
    )
    member = await db.scalar(stmt)
    if not member:
        raise HTTPException(status_code=403, detail="Not clique member")


async def check_blocking(
    actor_id: UUID,
    target_user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    # Check if actor blocked target or target blocked actor
    stmt = select(Follow).where(
        ((Follow.follower_user_id == actor_id) & (Follow.followee_user_id == target_user_id)) |
        ((Follow.follower_user_id == target_user_id) & (Follow.followee_user_id == actor_id)),
        Follow.status == "blocked"
    )
    block = await db.scalar(stmt)
    if block:
        raise HTTPException(status_code=404, detail="User not found")


def parse_sort(sort: str | None) -> tuple[str, str]:
    if not sort:
        return "created_at", "desc"
    if ":" in sort:
        field, direction = sort.split(":", 1)
        return field, direction
    return sort, "desc"


def parse_limit_cursor(limit: int | None, cursor: str | None) -> tuple[int, str | None]:
    limit = min(limit or 20, 50)
    return limit, cursor