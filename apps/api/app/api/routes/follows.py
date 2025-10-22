from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...api.openapi_helpers import (
    combine_openapi_extra,
    error_responses,
    pagination_parameters,
    secured,
)
from ...core.errors import Forbidden, NotFound, Validation
from ...models.user import User
from ...schemas import CursorPageFollows, Follow as FollowSchema
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

router = APIRouter(prefix="/api/v1/users/{user_id}/follow", tags=["Users"])


def _translate_error(exc: ValueError) -> Exception:
    message = str(exc)
    if message in {"Cannot follow yourself", "User not found"}:
        return Validation(message)
    if message == "Cannot follow blocked user":
        return Forbidden()
    if message == "Cannot approve non-pending follow":
        return Validation("Follow request is not pending")
    return Validation(message)


@router.post(
    "",
    summary="Follow user",
    description="Send a follow request or follow immediately if the account is public.",
    response_model=FollowSchema,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Follow request sent"},
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def follow(
    user_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        follow = await follow_user(db, str(current_user.id), str(user_id))
    except ValueError as exc:
        raise _translate_error(exc)
    return follow


@router.post(
    "/approve",
    summary="Approve follow request",
    description="Accept a pending follow request from another user.",
    response_model=FollowSchema,
    responses={
        200: {"description": "Follow approved"},
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def approve(
    user_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        follow = await approve_follow(db, str(current_user.id), str(user_id))
    except ValueError as exc:
        raise _translate_error(exc)
    if not follow:
        raise NotFound()
    return follow


@router.post(
    "/reject",
    summary="Reject follow request",
    description="Decline a pending follow request.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "Follow rejected",
            "content": {"application/json": {"example": {"status": "rejected"}}},
        },
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def reject(
    user_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await reject_follow(db, str(current_user.id), str(user_id))
    return {"status": "rejected"}


@router.delete(
    "",
    summary="Unfollow user",
    description="Stop following another user.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "Unfollowed",
            "content": {"application/json": {"example": {"status": "unfollowed"}}},
        },
        **error_responses(401, 404),
    },
    openapi_extra=secured(),
)
async def unfollow(
    user_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await unfollow_user(db, str(current_user.id), str(user_id))
    return {"status": "unfollowed"}


@router.delete(
    "/followers/{follower_id}",
    summary="Remove follower",
    description="Remove a follower from your audience.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "Follower removed",
            "content": {"application/json": {"example": {"status": "removed"}}},
        },
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def remove_follower(
    user_id: UUID,
    follower_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id:
        raise Forbidden()
    await unfollow_user(db, str(follower_id), str(user_id))
    return {"status": "removed"}


@router.get(
    "/followers",
    summary="List followers",
    description="Paginated list of followers for the specified user.",
    response_model=CursorPageFollows,
    responses={
        200: {"description": "Followers page"},
        **error_responses(401, 404),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def list_followers(
    user_id: UUID,
    current_user: User = Depends(require_active_user),
    cursor: Optional[str] = Query(
        None, include_in_schema=False, description="Opaque pagination cursor"
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
        include_in_schema=False,
        description="Page size (default 20, max 100)",
    ),
    db: AsyncSession = Depends(get_db),
):
    limit = min(max(limit, 1), 100)
    followers, next_cursor = await get_followers(db, str(user_id), cursor, limit)
    return CursorPageFollows(items=followers, next_cursor=next_cursor)


@router.get(
    "/following",
    summary="List following",
    description="Paginated list of accounts the specified user follows.",
    response_model=CursorPageFollows,
    responses={
        200: {"description": "Following page"},
        **error_responses(401, 404),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def list_following(
    user_id: UUID,
    current_user: User = Depends(require_active_user),
    cursor: Optional[str] = Query(
        None, include_in_schema=False, description="Opaque pagination cursor"
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
        include_in_schema=False,
        description="Page size (default 20, max 100)",
    ),
    db: AsyncSession = Depends(get_db),
):
    limit = min(max(limit, 1), 100)
    following, next_cursor = await get_following(db, str(user_id), cursor, limit)
    return CursorPageFollows(items=following, next_cursor=next_cursor)


@router.post(
    "/block",
    summary="Block user",
    description="Block another user; any follow relationship is converted to a block.",
    response_model=FollowSchema,
    responses={
        200: {"description": "User blocked"},
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def block(
    user_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        follow = await block_user(db, str(current_user.id), str(user_id))
    except ValueError as exc:
        raise _translate_error(exc)
    return follow


@router.delete(
    "/block",
    summary="Unblock user",
    description="Remove a previously created block.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "User unblocked",
            "content": {"application/json": {"example": {"status": "unblocked"}}},
        },
        **error_responses(401, 404),
    },
    openapi_extra=secured(),
)
async def unblock(
    user_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await unblock_user(db, str(current_user.id), str(user_id))
    return {"status": "unblocked"}
