from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import (
    get_db,
    get_optional_user,
    require_active_user,
    require_clique_owner,
)
from ...core.errors import Forbidden, NotFound, Validation
from ...models.enums import Privacy
from ...models.user import User
from ...schemas import (
    Clique as CliqueSchema,
    CliqueCreate,
    CliqueInvite as CliqueInviteSchema,
    CliqueInviteCreate,
    CliqueMember as CliqueMemberSchema,
    CliqueUpdate,
    CursorPage,
    Post as PostSchema,
)
from ...services.cliques import (
    create_clique,
    create_invite,
    get_pending_members,
    get_clique_by_id,
    get_clique_public,
    get_clique_members,
    get_feed_posts,
    is_member_of_clique,
    join_clique,
    leave_clique,
    update_clique_details,
    delete_clique as delete_clique_service,
    approve_member,
    reject_member,
)

router = APIRouter(prefix="/cliques", tags=["Cliques"])


@router.get("/feed", response_model=CursorPage[PostSchema])
async def feed(
    cursor: str | None = Query(None),
    limit: int = Query(20),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    limit = min(max(limit, 1), 100)
    posts, next_cursor = await get_feed_posts(db, str(current_user.id), cursor, limit)
    items = [PostSchema.model_validate(post) for post in posts]
    return CursorPage[PostSchema](items=items, next_cursor=next_cursor)


@router.post("", response_model=CliqueSchema, status_code=status.HTTP_201_CREATED)
async def create(
    data: CliqueCreate,
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


@router.get("/{clique_id}", response_model=dict)
async def get_clique(
    clique_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
):
    requester_id = str(current_user.id) if current_user else None
    data = await get_clique_public(db, str(clique_id), requester_id)
    if data is None:
        raise NotFound()
    return data


@router.patch("/{clique_id}", response_model=CliqueSchema)
async def update_clique(
    clique_id: UUID,
    data: CliqueUpdate,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    try:
        clique = await update_clique_details(db, str(clique_id), data)
    except ValueError:
        raise NotFound()
    return CliqueSchema.model_validate(clique)


@router.delete("/{clique_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_clique(
    clique_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    try:
        await delete_clique_service(db, str(clique_id))
    except ValueError:
        raise NotFound()


@router.post("/{clique_id}/join", response_model=CliqueMemberSchema)
async def join(
    clique_id: UUID,
    invite_token: str | None = Query(None),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        membership = await join_clique(
            db, str(current_user.id), str(clique_id), invite_token
        )
    except ValueError as exc:
        raise Validation(str(exc))
    return CliqueMemberSchema.model_validate(membership)


@router.delete("/{clique_id}/members/me")
async def leave(
    clique_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await leave_clique(db, str(current_user.id), str(clique_id))
    return {"status": "left"}


@router.get("/{clique_id}/members", response_model=CursorPage[CliqueMemberSchema])
async def list_members(
    clique_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(20),
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
    limit = min(max(limit, 1), 100)
    members, next_cursor = await get_clique_members(db, str(clique_id), cursor, limit)
    items = [CliqueMemberSchema.model_validate(member) for member in members]
    return CursorPage[CliqueMemberSchema](items=items, next_cursor=next_cursor)


@router.get(
    "/{clique_id}/members/pending", response_model=CursorPage[CliqueMemberSchema]
)
async def list_pending_members(
    clique_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(20),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    limit = min(max(limit, 1), 100)
    members, next_cursor = await get_pending_members(db, str(clique_id), cursor, limit)
    items = [CliqueMemberSchema.model_validate(member) for member in members]
    return CursorPage[CliqueMemberSchema](items=items, next_cursor=next_cursor)


@router.post(
    "/{clique_id}/members/{member_id}/approve",
    response_model=CliqueMemberSchema,
)
async def approve_membership(
    clique_id: UUID,
    member_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    try:
        membership = await approve_member(db, str(clique_id), str(member_id))
    except ValueError as exc:
        raise Validation(str(exc))
    return CliqueMemberSchema.model_validate(membership)


@router.post("/{clique_id}/members/{member_id}/reject")
async def reject_membership(
    clique_id: UUID,
    member_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    try:
        await reject_member(db, str(clique_id), str(member_id))
    except ValueError as exc:
        raise Validation(str(exc))
    return {"status": "rejected"}


@router.post("/{clique_id}/invites", response_model=CliqueInviteSchema)
async def create_invite_endpoint(
    clique_id: UUID,
    data: CliqueInviteCreate,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await require_clique_owner(clique_id, current_user, db)
    invite = await create_invite(db, str(clique_id), data)
    return CliqueInviteSchema.model_validate(invite)
