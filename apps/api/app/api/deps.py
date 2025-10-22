from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.auth import get_current_user, get_db, security
from ..core.errors import Forbidden, NotFound, Unauthorized
from ..models.clique import Clique, CliqueMember
from ..models.enums import FollowStatus, MembershipStatus
from ..models.user import Follow, User


async def require_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.is_active:
        raise Forbidden(message="User is not active")
    return current_user


async def require_clique_owner(
    clique_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> Clique:
    clique = await db.get(Clique, clique_id)
    if not clique or clique.owner_user_id != current_user.id:
        raise Forbidden(message="Not clique owner")
    return clique


async def require_clique_member(
    clique_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
) -> CliqueMember:
    stmt = select(CliqueMember).where(
        CliqueMember.clique_id == clique_id,
        CliqueMember.user_id == current_user.id,
        CliqueMember.status == MembershipStatus.JOINED,
    )
    member = await db.scalar(stmt)
    if not member:
        raise Forbidden(message="Not clique member")
    return member


async def check_blocking(
    actor_id: UUID,
    target_user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    # Check if actor blocked target or target blocked actor
    stmt = select(Follow).where(
        (
            (Follow.follower_user_id == actor_id)
            & (Follow.followee_user_id == target_user_id)
        )
        | (
            (Follow.follower_user_id == target_user_id)
            & (Follow.followee_user_id == actor_id)
        ),
        Follow.status == FollowStatus.BLOCKED,
    )
    block = await db.scalar(stmt)
    if block:
        raise NotFound("User not found")


async def get_optional_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ] = None,
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        return await get_current_user(credentials=credentials, db=db)
    except Unauthorized:
        raise


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
