from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, parse_limit_cursor, require_active_user
from ...api.openapi_helpers import (
    combine_openapi_extra,
    error_responses,
    pagination_parameters,
    secured,
)
from ...core.errors import Forbidden, NotFound, Validation
from ...models.enums import PostStatus, Privacy
from ...models.post import Comment, Post
from ...models.user import User
from ...schemas import Comment as CommentSchema
from ...schemas import CommentCreate, CursorPagePosts
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

router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])


@router.post(
    "/cliques/{clique_id}/posts",
    summary="Create post in clique",
    description="Clique owners create posts to share updates with members.",
    response_model=PostSchema,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "Post created",
            "content": {
                "application/json": {
                    "example": {
                        "id": "7415722e-4e4f-4f8b-8c44-2924f905a712",
                        "clique_id": "257c6140-3ab2-4e74-bac6-41b4ed9f8f2e",
                        "author_user_id": "93d52d58-eac4-4e74-a69d-6410a1de0970",
                        "content": "✨ Spring product launch this Friday at 5pm!",
                        "status": "posted",
                        "like_count": 0,
                        "comment_count": 0,
                        "created_at": "2024-04-01T12:00:00Z",
                        "updated_at": "2024-04-01T12:00:00Z",
                    }
                }
            },
        },
        **error_responses(401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def create_post_route(
    clique_id: UUID,
    data: PostCreate = Body(
        ...,
        examples={
            "announcement": {
                "summary": "Publish announcement",
                "value": {
                    "content": "✨ Spring product launch this Friday at 5pm!",
                    "status": "posted",
                },
            }
        },
    ),
    current_user: User = Depends(require_active_user),
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


@router.get(
    "/cliques/{clique_id}/posts",
    summary="List clique posts",
    description="Paginated posts visible to the current user, including engagement metadata.",
    response_model=CursorPagePosts,
    responses={
        200: {"description": "Posts page"},
        **error_responses(401, 403, 404),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def list_clique_posts_route(
    clique_id: UUID,
    current_user: User = Depends(require_active_user),
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
    return CursorPagePosts(items=posts, next_cursor=next_cursor)


@router.get(
    "/{post_id}",
    summary="Get post",
    description="Retrieve a post with reactions and visibility checks applied.",
    response_model=PostSchema,
    responses={
        200: {"description": "Post detail"},
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def get_post_route(
    post_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    post_record = await _require_post(db, post_id)
    await _ensure_post_visibility(db, post_record, current_user)
    post = await get_post_by_id(db, str(post_id), str(current_user.id))
    if not post:
        raise NotFound()
    return post


@router.patch(
    "/{post_id}",
    summary="Update post",
    description="Post authors or clique owners can edit content or status.",
    response_model=PostSchema,
    responses={
        200: {"description": "Post updated"},
        **error_responses(401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def update_post_route(
    post_id: UUID,
    data: PostUpdate = Body(
        ...,
        examples={
            "publish": {
                "summary": "Publish draft",
                "value": {"status": "posted"},
            }
        },
    ),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, post_id)
    await _ensure_post_owner_or_clique_owner(db, post, current_user)
    updated = await update_post(db, str(post_id), data.content, data.status)
    if not updated:
        raise NotFound()
    refreshed = await get_post_by_id(db, str(post_id), str(current_user.id))
    return refreshed


@router.delete(
    "/{post_id}",
    summary="Delete post",
    description="Delete a post as the author or clique owner.",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Post deleted"},
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def delete_post_route(
    post_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, post_id)
    await _ensure_post_owner_or_clique_owner(db, post, current_user)
    await delete_post(db, str(post_id))
    return Response(status_code=204)


@router.post(
    "/{post_id}/like",
    summary="Like post",
    description="Toggle the current user's like on the specified post.",
    response_model=PostSchema,
    responses={
        200: {
            "description": "Post with updated reactions",
            "content": {
                "application/json": {
                    "example": {
                        "id": "7415722e-4e4f-4f8b-8c44-2924f905a712",
                        "like_count": 12,
                        "comment_count": 3,
                        "viewer_has_liked": True,
                    }
                }
            },
        },
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def like_route(
    post_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, post_id)
    await _ensure_post_visibility(db, post, current_user)
    result = await like_post(db, str(current_user.id), str(post_id))
    return result or await get_post_by_id(db, str(post_id), str(current_user.id))


@router.delete(
    "/{post_id}/like",
    summary="Unlike post",
    description="Remove the user's like from the post.",
    response_model=PostSchema,
    responses={
        200: {
            "description": "Post with updated reactions",
            "content": {
                "application/json": {
                    "example": {
                        "id": "7415722e-4e4f-4f8b-8c44-2924f905a712",
                        "like_count": 11,
                        "comment_count": 3,
                        "viewer_has_liked": False,
                    }
                }
            },
        },
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def unlike_route(
    post_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, post_id)
    await _ensure_post_visibility(db, post, current_user)
    result = await unlike_post(db, str(current_user.id), str(post_id))
    return result or await get_post_by_id(db, str(post_id), str(current_user.id))


@router.post(
    "/{post_id}/comments",
    summary="Create comment",
    description="Add a comment to a visible post.",
    response_model=CommentSchema,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "Comment created",
            "content": {
                "application/json": {
                    "example": {
                        "id": "b1d38d06-5801-4b69-90c6-74c4950c333a",
                        "post_id": "7415722e-4e4f-4f8b-8c44-2924f905a712",
                        "user_id": "93d52d58-eac4-4e74-a69d-6410a1de0970",
                        "content": "Can't wait to see the new collection!",
                        "created_at": "2024-04-01T13:00:00Z",
                    }
                }
            },
        },
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def create_comment_route(
    post_id: UUID,
    data: CommentCreate = Body(
        ...,
        examples={
            "supportive": {
                "summary": "Friendly comment",
                "value": {"content": "Can't wait to see the new collection!"},
            }
        },
    ),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, post_id)
    await _ensure_post_visibility(db, post, current_user)
    try:
        return await create_comment(db, str(post_id), str(current_user.id), data)
    except ValueError as exc:
        raise Validation(str(exc))


@router.delete(
    "/comments/{comment_id}",
    summary="Delete comment",
    description="Delete a comment authored by the user or managed by the clique owner.",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        204: {"description": "Comment deleted"},
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def delete_comment_route(
    comment_id: UUID,
    current_user: User = Depends(require_active_user),
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
