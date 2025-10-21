from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, parse_limit_cursor, require_active_user, require_clique_owner
from ...models.enums import Privacy
from ...models.user import User
from ...schemas.clique import CliqueCreate, CliqueUpdate
from ...services.cliques import (
    create_clique,
    get_clique_by_id,
    get_clique_members,
    get_feed_posts,
    join_clique,
    leave_clique,
)

router = APIRouter(prefix="/cliques", tags=["Cliques"])


@router.post("", response_model=dict)
async def create(
    data: CliqueCreate,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    # TODO: Check is_business_page
    clique = await create_clique(
        db,
        str(current_user.id),
        data.name,
        data.description,
        data.privacy,
        data.occupations,
    )
    return {"id": clique.id}


@router.get("/{clique_id}", response_model=dict)
async def get_clique(
    clique_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    clique = await get_clique_by_id(db, str(clique_id))
    # TODO: Respect privacy
    return clique


@router.patch("/{clique_id}")
async def update_clique(
    clique_id: UUID,
    data: CliqueUpdate,
    current_user: Annotated[User, Depends(require_clique_owner)],
    db: AsyncSession = Depends(get_db),
):
    # TODO: Update
    pass


@router.delete("/{clique_id}")
async def delete_clique(
    clique_id: UUID,
    current_user: Annotated[User, Depends(require_clique_owner)],
    db: AsyncSession = Depends(get_db),
):
    # TODO: Soft delete
    pass


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


@router.get("/{clique_id}/members", response_model=dict)
async def list_members(
    clique_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(20),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    members = await get_clique_members(db, str(clique_id), cursor, limit)
    return {"items": members, "nextCursor": None}


@router.get("/feed", response_model=dict)
async def feed(
    cursor: str | None = Query(None),
    limit: int = Query(20),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    posts = await get_feed_posts(db, str(current_user.id), cursor, limit)
    return {"items": posts, "nextCursor": None}