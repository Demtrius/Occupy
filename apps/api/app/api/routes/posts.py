from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, parse_limit_cursor, require_active_user
from ...models.enums import PostStatus
from ...models.user import User
from ...schemas.post import PostCreate, PostUpdate
from ...services.posts import (
    create_post,
    delete_post,
    get_clique_posts,
    get_post_by_id,
    like_post,
    unlike_post,
    update_post,
)

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("/cliques/{clique_id}/posts", response_model=dict)
async def create(
    clique_id: UUID,
    data: PostCreate,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    post = await create_post(
        db,
        str(current_user.id),
        str(clique_id),
        data.content,
        data.status or PostStatus.DRAFT,
    )
    return {"id": post.id}


@router.get("/cliques/{clique_id}/posts", response_model=dict)
async def list_clique_posts(
    clique_id: UUID,
    cursor: str | None = Query(None),
    limit: int = Query(20),
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    posts = await get_clique_posts(db, str(clique_id), cursor, limit)
    return {"items": posts, "nextCursor": None}


@router.get("/{post_id}", response_model=dict)
async def get_post(
    post_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    post = await get_post_by_id(db, str(post_id))
    return post


@router.patch("/{post_id}")
async def update(
    post_id: UUID,
    data: PostUpdate,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    # TODO: Check ownership
    await update_post(db, str(post_id), data.content, data.status)


@router.delete("/{post_id}")
async def delete(
    post_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    # TODO: Check ownership
    await delete_post(db, str(post_id))


@router.post("/{post_id}/like")
async def like(
    post_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await like_post(db, str(current_user.id), str(post_id))


@router.delete("/{post_id}/like")
async def unlike(
    post_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await unlike_post(db, str(current_user.id), str(post_id))