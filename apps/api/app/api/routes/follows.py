from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...core.errors import Forbidden, NotFound, Validation
from ...models.user import User
from ...schemas import CursorPage, Follow as FollowSchema
from ...services.follows import (
    approve_follow,
    block_user,
    follow_user,
    get_followers,
    get_following,
    reject_follow,
    unblock_user,
    unfollow_user,
)

router = APIRouter(prefix="/users/{user_id}/follow", tags=["Follows"])


def _translate_error(exc: ValueError) -> Exception:
    message = str(exc)
    if message in {"Cannot follow yourself", "User not found"}:
        return Validation(message)
    if message == "Cannot follow blocked user":
        return Forbidden()
    if message == "Cannot approve non-pending follow":
        return Validation("Follow request is not pending")
    return Validation(message)


@router.post("", response_model=FollowSchema)
async def follow(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    try:
        follow = await follow_user(db, str(current_user.id), str(user_id))
    except ValueError as exc:
        raise _translate_error(exc)
    return follow


@router.post("/approve", response_model=FollowSchema)
async def approve(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    try:
        follow = await approve_follow(db, str(current_user.id), str(user_id))
    except ValueError as exc:
        raise _translate_error(exc)
    if not follow:
        raise NotFound()
    return follow


@router.post("/reject")
async def reject(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await reject_follow(db, str(current_user.id), str(user_id))
    return {"status": "rejected"}


@router.delete("")
async def unfollow(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await unfollow_user(db, str(current_user.id), str(user_id))
    return {"status": "unfollowed"}


@router.delete("/followers/{follower_id}")
async def remove_follower(
    user_id: UUID,
    follower_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id:
        raise Forbidden()
    await unfollow_user(db, str(follower_id), str(user_id))
    return {"status": "removed"}


@router.get("/followers", response_model=CursorPage[FollowSchema])
async def list_followers(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    cursor: Optional[str] = Query(None),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
):
    limit = min(max(limit, 1), 100)
    followers, next_cursor = await get_followers(db, str(user_id), cursor, limit)
    return CursorPage[FollowSchema](items=followers, next_cursor=next_cursor)


@router.get("/following", response_model=CursorPage[FollowSchema])
async def list_following(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    cursor: Optional[str] = Query(None),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
):
    limit = min(max(limit, 1), 100)
    following, next_cursor = await get_following(db, str(user_id), cursor, limit)
    return CursorPage[FollowSchema](items=following, next_cursor=next_cursor)


@router.post("/block", response_model=FollowSchema)
async def block(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    try:
        follow = await block_user(db, str(current_user.id), str(user_id))
    except ValueError as exc:
        raise _translate_error(exc)
    return follow


@router.delete("/block")
async def unblock(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await unblock_user(db, str(current_user.id), str(user_id))
    return {"status": "unblocked"}
