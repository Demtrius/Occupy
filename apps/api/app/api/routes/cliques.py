from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Path, status
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import (
    get_db,
    get_optional_user,
    require_active_user,
    require_clique_owner,
)
from ...api.openapi_helpers import (
    combine_openapi_extra,
    error_responses,
    pagination_parameters,
    secured,
)
from ...core.errors import Forbidden, NotFound, Validation
from ...models.enums import Privacy
from ...models.user import User
from ...schemas import (
    Clique as CliqueSchema,
)
from ...schemas import (
    CliqueCreate,
    CliqueInviteCreate,
    CliqueUpdate,
    CursorPageCliqueMembers,
    CursorPageCliques,
    CursorPagePosts,
)
from ...schemas import (
    CliqueInvite as CliqueInviteSchema,
)
from ...schemas import (
    CliqueMember as CliqueMemberSchema,
)
from ...schemas import (
    Post as PostSchema,
)
from ...schemas.base import BaseSchema
from ...services.cliques import (
    approve_member,
    create_clique,
    create_invite,
    get_all_cliques,
    get_clique_by_id,
    get_clique_members,
    get_clique_public,
    get_feed_posts,
    get_pending_members,
    get_user_cliques,
    is_member_of_clique,
    join_clique,
    leave_clique,
    reject_member,
    update_clique_details,
)
from ...services.cliques import (
    delete_clique as delete_clique_service,
)

router = APIRouter(prefix="/api/v1/cliques", tags=["Cliques"])


class CursorPaginationParams(BaseSchema):
    cursor: str | None = Field(
        default=None, description="Opaque pagination cursor from `nextCursor`."
    )
    limit: int = Field(
        default=20, ge=1, le=100, description="Page size (default 20, max 100)"
    )


class JoinParams(BaseSchema):
    invite_token: str | None = Field(
        default=None,
        description="Invite token for private cliques, if required.",
        json_schema_extra={"examples": ["clique-invite-abc123"]},
    )


@router.get(
    "/feed",
    operation_id="CliquesFeed",
    summary="View clique feed",
    description="Paginated feed of posts from cliques the user belongs to.",
    response_model=CursorPagePosts,
    responses={
        200: {"description": "Feed page"},
        **error_responses(401),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def feed(
    params: CursorPaginationParams = Depends(),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    cursor = params.cursor
    limit = min(max(params.limit, 1), 100)
    posts, next_cursor = await get_feed_posts(db, str(current_user.id), cursor, limit)
    items = [PostSchema.model_validate(post) for post in posts]
    return CursorPagePosts(items=items, next_cursor=next_cursor)


@router.get(
    "",
    operation_id="Cliques",
    summary="List all cliques",
    description="Paginated list of all cliques visible to the current user (public or member).",
    response_model=CursorPageCliques,
    responses={
        200: {"description": "Cliques page"},
        **error_responses(401),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def list_cliques(
    params: CursorPaginationParams = Depends(),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    cursor = params.cursor
    limit = min(max(params.limit, 1), 100)
    cliques, next_cursor = await get_all_cliques(
        db, str(current_user.id), cursor, limit
    )
    items = [CliqueSchema.model_validate(clique) for clique in cliques]
    return CursorPageCliques(items=items, next_cursor=next_cursor)


@router.post(
    "",
    operation_id="CliquesCreate",
    summary="Create clique",
    description="Business pages create cliques to organize services and bookings.",
    response_model=CliqueSchema,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Clique created"},
        **error_responses(401, 403, 422),
    },
    openapi_extra=secured(),
)
async def create(
    data: CliqueCreate = Body(
        ...,
        examples={
            "studio": {
                "summary": "Photography studio",
                "value": {
                    "name": "Clique Studio",
                    "description": "Creative studio for boutique brands.",
                    "privacy": "private",
                    "timezone": "America/New_York",
                    "cancellationCutoffHours": 24,
                    "occupationIds": [
                        "9b07c852-0cf4-4d05-857f-46bd7d4b52c5",
                        "8f9d6c2a-9525-4cd3-b963-59f82a28cd31",
                    ],
                },
            }
        },
    ),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.is_business_page:
        raise Forbidden()
    clique = await create_clique(
        db,
        str(current_user.id),
        data,
    )
    return CliqueSchema.model_validate(clique)


@router.get(
    "/{cliqueId}",
    operation_id="CliquesById",
    summary="Get clique",
    description="Retrieve the public profile for a clique, with visibility rules applied.",
    response_model=dict[str, Any],
    responses={
        200: {"description": "Clique profile"},
        **error_responses(404),
    },
)
async def get_clique(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    requester_id = str(current_user.id) if current_user else None
    data = await get_clique_public(db, str(clique_id), requester_id)
    if data is None:
        raise NotFound()
    return data


@router.patch(
    "/{cliqueId}",
    operation_id="CliquesUpdateById",
    summary="Update clique",
    description="Clique owners can edit name, imagery, privacy, and cancellation policy.",
    response_model=CliqueSchema,
    responses={
        200: {"description": "Clique updated"},
        **error_responses(401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def update_clique(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    data: CliqueUpdate = Body(
        ...,
        examples={
            "adjust_policy": {
                "summary": "Update cancellation policy",
                "value": {"cancellationCutoffHours": 12},
            }
        },
    ),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    try:
        clique = await update_clique_details(db, str(clique_id), data)
    except ValueError:
        raise NotFound()
    return CliqueSchema.model_validate(clique)


@router.delete(
    "/{cliqueId}",
    operation_id="CliquesDeleteById",
    summary="Delete clique",
    description="Clique owners can permanently delete their clique.",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Clique deleted"},
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def delete_clique(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    try:
        await delete_clique_service(db, str(clique_id))
    except ValueError:
        raise NotFound()


@router.post(
    "/{cliqueId}/join",
    operation_id="CliquesJoin",
    summary="Request to join clique",
    description="Join a clique using an invite token when required.",
    response_model=CliqueMemberSchema,
    responses={
        200: {"description": "Join request recorded"},
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def join(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    params: JoinParams = Depends(),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        membership = await join_clique(
            db, str(current_user.id), str(clique_id), params.invite_token
        )
    except ValueError as exc:
        raise Validation(str(exc))
    return CliqueMemberSchema.model_validate(membership)


@router.delete(
    "/{cliqueId}/members/me",
    operation_id="CliquesLeave",
    summary="Leave clique",
    description="Members can leave a clique they previously joined.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "Left clique",
            "content": {"application/json": {"example": {"status": "left"}}},
        },
        **error_responses(401, 404),
    },
    openapi_extra=secured(),
)
async def leave(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await leave_clique(db, str(current_user.id), str(clique_id))
    return {"status": "left"}


@router.get(
    "/{cliqueId}/members",
    operation_id="CliquesMembers",
    summary="List clique members",
    description="Paginated list of members with role and status.",
    response_model=CursorPageCliqueMembers,
    responses={
        200: {"description": "Members page"},
        **error_responses(401, 403, 404),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def list_members(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    params: CursorPaginationParams = Depends(),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    clique = await get_clique_by_id(db, str(clique_id))
    if not clique:
        raise NotFound()
    if (
        clique.privacy == Privacy.PRIVATE
        and clique.owner_user_id != current_user.id
        and not await is_member_of_clique(db, str(clique_id), str(current_user.id))
    ):
        raise Forbidden()
    cursor = params.cursor
    limit = min(max(params.limit, 1), 100)
    members, next_cursor = await get_clique_members(db, str(clique_id), cursor, limit)
    items = [CliqueMemberSchema.model_validate(member) for member in members]
    return CursorPageCliqueMembers(items=items, next_cursor=next_cursor)


@router.get(
    "/{cliqueId}/members/pending",
    operation_id="CliquesMembersPending",
    summary="List pending membership requests",
    description="View join requests awaiting moderation by the clique owner.",
    response_model=CursorPageCliqueMembers,
    responses={
        200: {"description": "Pending members"},
        **error_responses(401, 403, 404),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def list_pending_members(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    params: CursorPaginationParams = Depends(),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    cursor = params.cursor
    limit = min(max(params.limit, 1), 100)
    members, next_cursor = await get_pending_members(db, str(clique_id), cursor, limit)
    items = [CliqueMemberSchema.model_validate(member) for member in members]
    return CursorPageCliqueMembers(items=items, next_cursor=next_cursor)


@router.post(
    "/{cliqueId}/members/{memberId}/approve",
    operation_id="CliquesMembersApprove",
    response_model=CliqueMemberSchema,
    summary="Approve membership request",
    description="Clique owners approve pending members.",
    responses={
        200: {"description": "Membership approved"},
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def approve_membership(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    member_id: Annotated[UUID, Path(alias="memberId")],
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    try:
        membership = await approve_member(db, str(clique_id), str(member_id))
    except ValueError as exc:
        raise Validation(str(exc))
    return CliqueMemberSchema.model_validate(membership)


@router.post(
    "/{cliqueId}/members/{memberId}/reject",
    operation_id="CliquesMembersReject",
    summary="Reject membership request",
    description="Decline a pending membership request.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "Membership rejected",
            "content": {"application/json": {"example": {"status": "rejected"}}},
        },
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def reject_membership(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    member_id: Annotated[UUID, Path(alias="memberId")],
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    try:
        await reject_member(db, str(clique_id), str(member_id))
    except ValueError as exc:
        raise Validation(str(exc))
    return {"status": "rejected"}


@router.get(
    "/user/{userId}/cliques",
    operation_id="CliquesUser",
    summary="List user cliques",
    description="Paginated cliques owned by a user visible to the current user, respecting privacy settings.",
    response_model=CursorPageCliques,
    responses={
        200: {"description": "User cliques page"},
        **error_responses(401),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def list_user_cliques_route(
    user_id: Annotated[UUID, Path(alias="userId")],
    params: CursorPaginationParams = Depends(),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    cursor = params.cursor
    limit = min(max(params.limit, 1), 100)
    cliques, next_cursor = await get_user_cliques(
        db, str(user_id), str(current_user.id), cursor, limit
    )
    items = [CliqueSchema.model_validate(clique) for clique in cliques]
    return CursorPageCliques(items=items, next_cursor=next_cursor)


@router.post(
    "/{cliqueId}/invites",
    operation_id="CliquesInvites",
    summary="Create invite link",
    description="Clique owners create invite tokens for members to join.",
    response_model=CliqueInviteSchema,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Invite created"},
        **error_responses(401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def create_invite_endpoint(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    data: CliqueInviteCreate = Body(
        ...,
        examples={
            "limited": {
                "summary": "Limited-use invite",
                "value": {
                    "expiresAt": "2024-05-01T00:00:00Z",
                    "maxUses": 20,
                },
            }
        },
    ),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    invite = await create_invite(db, str(clique_id), data)
    return CliqueInviteSchema.model_validate(invite)
