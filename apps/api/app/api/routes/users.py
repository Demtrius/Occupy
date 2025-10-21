from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, parse_limit_cursor, require_active_user
from ...models.user import User
from ...schemas.user import User as UserSchema, UserUpdate
from ...services.users import get_user_by_id

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    # TODO: Respect privacy and blocking
    user = await get_user_by_id(db, str(user_id))
    return user


@router.get("/me", response_model=UserSchema)
async def get_me(current_user: Annotated[User, Depends(require_active_user)]):
    return current_user


@router.patch("/me", response_model=UserSchema)
async def update_me(
    data: UserUpdate,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    # TODO: Update user
    return current_user


@router.get("", response_model=dict)
async def search_users(
    current_user: Annotated[User, Depends(require_active_user)],
    q: str = Query(""),
    occupation_id: UUID | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(20),
    sort: str = Query("created_at:desc"),
    db: AsyncSession = Depends(get_db),
):
    # TODO: Implement search
    return {"items": [], "nextCursor": None}