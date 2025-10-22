from uuid import UUID

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Path, Query
from pydantic import AliasChoices
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import check_blocking, get_db, parse_limit_cursor, require_active_user
from ...api.openapi_helpers import (
    combine_openapi_extra,
    error_responses,
    pagination_parameters,
    secured,
)
from ...core.errors import NotFound
from ...models.enums import FollowStatus
from ...models.user import Follow, User
from ...schemas import CursorPageUsers
from ...schemas.user import User as UserSchema, UserUpdate
from ...services.users import (
    get_user_by_id,
    search_users as search_users_service,
    update_user_profile,
)

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get(
    "/me",
    summary="Get current user",
    description="Return the profile for the authenticated user.",
    response_model=UserSchema,
    responses={
        200: {"description": "Current user profile"},
        **error_responses(401),
    },
    openapi_extra=secured(),
)
async def get_me(current_user: User = Depends(require_active_user)):
    return UserSchema.model_validate(current_user)


@router.patch(
    "/me",
    summary="Update current user",
    description="Patch the profile fields for the authenticated user.",
    response_model=UserSchema,
    responses={
        200: {"description": "Updated profile"},
        **error_responses(401, 422),
    },
    openapi_extra=secured(),
)
async def update_me(
    data: UserUpdate = Body(
        ...,
        examples={
             "profile": {
                 "summary": "Update bio and image",
                 "value": {
                     "fullName": "Clique Founder",
                     "bio": "Curating experiences for boutique brands.",
                     "profileImageUrl": "https://cdn.example.com/profiles/clique_founder.png",
                 },
             }
        },
    ),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        return UserSchema.model_validate(current_user)
    updated = await update_user_profile(db, current_user, updates)
    return UserSchema.model_validate(updated)


@router.get(
    "",
    summary="Search users",
    description="Paginated user search supporting text query, occupation filter, and sort.",
    response_model=CursorPageUsers,
    responses={
        200: {"description": "Users page"},
        **error_responses(401, 422),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def search_users(
    current_user: User = Depends(require_active_user),
    q: str = Query(
        "",
        description="Free-text search across usernames and bios.",
    ),
    occupation_id: UUID | None = Query(
        None, alias="occupationId", description="Filter to users tagged with a specific occupation."
    ),
    cursor: str | None = Query(
        None, include_in_schema=False, description="Opaque pagination cursor"
    ),
    limit: int = Query(
        20,
        ge=1,
        le=50,
        include_in_schema=False,
        description="Page size (default 20, max 50)",
    ),
    sort: str = Query(
        "created_at:desc",
        description="Sort expression in the form `field:direction`.",
    ),
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
    return CursorPageUsers(items=items, next_cursor=next_cursor)


@router.get(
    "/{userId}",
    summary="Get user by id",
    description="Retrieve another user's profile respecting blocking and privacy.",
    response_model=UserSchema,
    responses={
        200: {"description": "User profile"},
        **error_responses(401, 404),
    },
    openapi_extra=secured(),
)
async def get_user(
    userId: Annotated[UUID, Path(alias="userId")],
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id == userId:
        return UserSchema.model_validate(current_user)

    await check_blocking(current_user.id, userId, db)

    user = await get_user_by_id(db, str(userId))
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
