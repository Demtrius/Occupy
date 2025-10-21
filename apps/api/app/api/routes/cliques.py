from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user, require_clique_owner
from ...core.errors import Forbidden, NotFound
from ...models.enums import Privacy
from ...models.user import User
from ...schemas import (
    Clique as CliqueSchema,
    CliqueCreate,
    CliqueMember as CliqueMemberSchema,
    CliqueUpdate,
    CursorPage,
    Post as PostSchema,
)
from ...services.cliques import (
    create_clique,
    get_clique_by_id,
    get_clique_members,
    get_feed_posts,
    is_member_of_clique,
    join_clique,
    leave_clique,
    update_clique_details,
    delete_clique,
)

router = APIRouter(prefix="/cliques", tags=["Cliques"])


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


@router.get("/{clique_id}", response_model=CliqueSchema)
async def get_clique(
    clique_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    clique = await get_clique_by_id(db, str(clique_id))
    if not clique:
        raise NotFound()

    if (
        clique.privacy == Privacy.PRIVATE
        and clique.owner_user_id != current_user.id
        and not await is_member_of_clique(db, str(clique.id), str(current_user.id))
    ):
        raise Forbidden()

    return CliqueSchema.model_validate(clique)


@router.patch("/{clique_id}", response_model=CliqueSchema)
async def update_clique(
    clique_id: UUID,
    data: CliqueUpdate,
    current_user: Annotated[User, Depends(require_clique_owner)],
    db: AsyncSession = Depends(get_db),
):
    try:
        clique = await update_clique_details(db, str(clique_id), data)
    except ValueError:
        raise NotFound()
    return CliqueSchema.model_validate(clique)


@router.delete("/{clique_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_clique(
    clique_id: UUID,
    current_user: Annotated[User, Depends(require_clique_owner)],
    db: AsyncSession = Depends(get_db),
):
    try:
        await delete_clique(db, str(clique_id))
    except ValueError:
        raise NotFound()


@router.post("/{clique_id}/join")
async def join(
    clique_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await join_clique(db, str(current_user.id), str(clique_id))


@router.delete("/{clique_id}/members/me")
async def leave(
    clique_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    await leave_clique(db, str(current_user.id), str(clique_id))


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
