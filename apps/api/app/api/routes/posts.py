from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, parse_limit_cursor, require_active_user
from ...core.errors import Forbidden, NotFound, Validation
from ...models.enums import PostStatus, Privacy
from ...models.post import Comment, Post
from ...models.user import User
from ...schemas import Comment as CommentSchema
from ...schemas import CommentCreate, CursorPage
from ...schemas.post import Post as PostSchema, PostCreate, PostUpdate
from ...services.cliques import get_clique_by_id, is_member_of_clique
from ...services.posts import (
    create_comment,
    create_post,
    delete_comment,
    delete_post,
    get_clique_posts,
    get_post_by_id,
    like_post,
    unlike_post,
    update_post,
)

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("/cliques/{clique_id}/posts", response_model=PostSchema, status_code=201)
async def create_post_route(
    clique_id: UUID,
    data: PostCreate,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    clique = await get_clique_by_id(db, str(clique_id))
    if not clique:
        raise NotFound()
    if clique.owner_user_id != current_user.id:
        raise Forbidden()
    post = await create_post(
        db,
        str(current_user.id),
        str(clique_id),
        data.content,
        data.status or PostStatus.DRAFT,
    )
    return post


@router.get("/cliques/{clique_id}/posts", response_model=CursorPage[PostSchema])
async def list_clique_posts_route(
    clique_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    cursor: str | None = Query(None),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
):
    limit, cursor = parse_limit_cursor(limit, cursor)
    clique = await get_clique_by_id(db, str(clique_id))
    if not clique:
        raise NotFound()
    if clique.privacy == Privacy.PRIVATE and clique.owner_user_id != current_user.id:
        is_member = await is_member_of_clique(db, str(clique_id), str(current_user.id))
        if not is_member:
            raise Forbidden()
    posts, next_cursor = await get_clique_posts(
        db, str(clique_id), str(current_user.id), cursor, limit
    )
    return CursorPage[PostSchema](items=posts, next_cursor=next_cursor)


@router.get("/{post_id}", response_model=PostSchema)
async def get_post_route(
    post_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    post_record = await _require_post(db, post_id)
    await _ensure_post_visibility(db, post_record, current_user)
    post = await get_post_by_id(db, str(post_id), str(current_user.id))
    if not post:
        raise NotFound()
    return post


@router.patch("/{post_id}", response_model=PostSchema)
async def update_post_route(
    post_id: UUID,
    data: PostUpdate,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, post_id)
    await _ensure_post_owner_or_clique_owner(db, post, current_user)
    updated = await update_post(db, str(post_id), data.content, data.status)
    if not updated:
        raise NotFound()
    refreshed = await get_post_by_id(db, str(post_id), str(current_user.id))
    return refreshed


@router.delete("/{post_id}", status_code=204)
async def delete_post_route(
    post_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, post_id)
    await _ensure_post_owner_or_clique_owner(db, post, current_user)
    await delete_post(db, str(post_id))
    return Response(status_code=204)


@router.post("/{post_id}/like", response_model=PostSchema)
async def like_route(
    post_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, post_id)
    await _ensure_post_visibility(db, post, current_user)
    result = await like_post(db, str(current_user.id), str(post_id))
    return result or await get_post_by_id(db, str(post_id), str(current_user.id))


@router.delete("/{post_id}/like", response_model=PostSchema)
async def unlike_route(
    post_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, post_id)
    await _ensure_post_visibility(db, post, current_user)
    result = await unlike_post(db, str(current_user.id), str(post_id))
    return result or await get_post_by_id(db, str(post_id), str(current_user.id))


@router.post("/{post_id}/comments", response_model=CommentSchema, status_code=201)
async def create_comment_route(
    post_id: UUID,
    data: CommentCreate,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, post_id)
    await _ensure_post_visibility(db, post, current_user)
    try:
        return await create_comment(db, str(post_id), str(current_user.id), data)
    except ValueError as exc:
        raise Validation(str(exc))


@router.delete("/comments/{comment_id}", status_code=204)
async def delete_comment_route(
    comment_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    comment = await db.get(Comment, comment_id)
    if not comment or comment.deleted_at is not None:
        raise NotFound()
    post = await _require_post(db, comment.post_id)
    if str(comment.user_id) != str(current_user.id):
        await _ensure_post_owner_or_clique_owner(db, post, current_user)
    try:
        await delete_comment(db, str(comment_id), str(current_user.id))
    except (ValueError, PermissionError) as exc:
        if isinstance(exc, PermissionError):
            raise Forbidden()
        raise NotFound()
    return Response(status_code=204)


async def _require_post(db: AsyncSession, post_id: UUID) -> Post:
    post = await db.get(Post, post_id)
    if not post or post.deleted_at is not None:
        raise NotFound()
    return post


async def _ensure_post_owner_or_clique_owner(
    db: AsyncSession,
    post: Post,
    current_user: User,
) -> None:
    if post.author_user_id == current_user.id:
        return
    clique = await get_clique_by_id(db, str(post.clique_id))
    if not clique or clique.owner_user_id != current_user.id:
        raise Forbidden()


async def _ensure_post_visibility(
    db: AsyncSession,
    post: Post,
    current_user: User,
) -> None:
    clique = await get_clique_by_id(db, str(post.clique_id))
    if not clique:
        raise NotFound()
    if clique.privacy == Privacy.PRIVATE and clique.owner_user_id != current_user.id:
        is_member = await is_member_of_clique(
            db, str(post.clique_id), str(current_user.id)
        )
        if not is_member:
            raise Forbidden()
