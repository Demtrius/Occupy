from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...core.errors import Forbidden
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


@router.post("", response_model=dict)
async def follow(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    follow = await follow_user(db, str(current_user.id), str(user_id))
    return {"status": follow.status.value}


@router.post("/approve")
async def approve(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await approve_follow(db, str(current_user.id), str(user_id))


@router.post("/reject")
async def reject(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await reject_follow(db, str(current_user.id), str(user_id))


@router.delete("")
async def unfollow(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await unfollow_user(db, str(current_user.id), str(user_id))


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
    items = [FollowSchema.model_validate(follow) for follow in followers]
    return CursorPage[FollowSchema](items=items, next_cursor=next_cursor)


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
    items = [FollowSchema.model_validate(follow) for follow in following]
    return CursorPage[FollowSchema](items=items, next_cursor=next_cursor)


@router.post("/block")
async def block(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await block_user(db, str(current_user.id), str(user_id))


@router.delete("/block")
async def unblock(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await unblock_user(db, str(current_user.id), str(user_id))
