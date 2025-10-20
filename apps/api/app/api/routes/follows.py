from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, parse_limit_cursor, require_active_user
from ...core.pagination import apply_cursor
from ...models.user import User
from ...schemas.user import User as UserSchema
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
    await follow_user(db, str(current_user.id), str(user_id))
    return {"status": "pending" if False else "accepted"}  # TODO: check privacy


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
    # TODO: Check ownership
    await unfollow_user(db, str(follower_id), str(user_id))


@router.get("/followers", response_model=dict)
async def list_followers(
    user_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(20),
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    limit = min(limit, 50)
    followers = await get_followers(db, str(user_id), cursor, limit)
    # TODO: Format with cursor
    return {"items": followers, "nextCursor": None}


@router.get("/following", response_model=dict)
async def list_following(
    user_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(20),
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    limit = min(limit, 50)
    following = await get_following(db, str(user_id), cursor, limit)
    # TODO: Format with cursor
    return {"items": following, "nextCursor": None}


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