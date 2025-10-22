from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import check_blocking, get_db, parse_limit_cursor, require_active_user
from ...core.errors import NotFound
from ...models.enums import FollowStatus
from ...models.user import Follow, User
from ...schemas import CursorPage
from ...schemas.user import User as UserSchema, UserUpdate
from ...services.users import (
    get_user_by_id,
    search_users as search_users_service,
    update_user_profile,
)

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserSchema)
async def get_me(current_user: Annotated[User, Depends(require_active_user)]):
    return UserSchema.model_validate(current_user)


@router.patch("/me", response_model=UserSchema)
async def update_me(
    data: UserUpdate,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        return UserSchema.model_validate(current_user)
    updated = await update_user_profile(db, current_user, updates)
    return UserSchema.model_validate(updated)


@router.get("", response_model=CursorPage[UserSchema])
async def search_users(
    current_user: Annotated[User, Depends(require_active_user)],
    q: str = Query(""),
    occupation_id: UUID | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(20),
    sort: str = Query("created_at:desc"),
    db: AsyncSession = Depends(get_db),
):
    limit, cursor = parse_limit_cursor(limit, cursor)
    descending = not sort.lower().endswith(":asc")

    users, next_cursor = await search_users_service(
        db,
        str(current_user.id),
        q.strip(),
        occupation_id,
        cursor,
        limit,
        descending=descending,
    )
    items = [UserSchema.model_validate(user) for user in users]
    return CursorPage[UserSchema](items=items, next_cursor=next_cursor)


@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    if current_user.id == user_id:
        return UserSchema.model_validate(current_user)

    await check_blocking(current_user.id, user_id, db)

    user = await get_user_by_id(db, str(user_id))
    if not user:
        raise NotFound()

    if user.is_private_account:
        stmt = select(Follow).where(
            Follow.follower_user_id == current_user.id,
            Follow.followee_user_id == user.id,
            Follow.status == FollowStatus.ACCEPTED,
        )
        relation = await db.scalar(stmt)
        if relation is None:
            raise NotFound()

    return UserSchema.model_validate(user)


