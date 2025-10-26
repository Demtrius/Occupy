from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Path, Query, Response, status
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
    get_feed_posts,
    get_post_by_id,
    get_user_posts,
    like_post,
    unlike_post,
    update_post,
)

router = APIRouter(prefix="/api/v1/posts", tags=["Posts"])


@router.get(
    "/feed",
    summary="Get feed posts",
    description="Paginated feed of posts visible to the current user, with optional filter for followings or cliques.",
    response_model=CursorPagePosts,
    responses={
        200: {"description": "Feed posts page"},
        **error_responses(401),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def get_feed_route(
    filter: str | None = Query(None, description="Filter type: 'followings' or 'cliques'. Default shows posts from public cliques or user's cliques."),
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
    posts, next_cursor = await get_feed_posts(
        db, str(current_user.id), filter, cursor, limit
    )
    return CursorPagePosts(items=posts, next_cursor=next_cursor)


@router.post(
    "/cliques/{cliqueId}/posts",
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
                         "cliqueId": "257c6140-3ab2-4e74-bac6-41b4ed9f8f2e",
                         "authorUserId": "93d52d58-eac4-4e74-a69d-6410a1de0970",
                         "content": "✨ Spring product launch this Friday at 5pm!",
                         "status": "posted",
                         "likesCount": 0,
                         "commentsCount": 0,
                         "likedByMe": False,
                         "createdAt": "2024-04-01T12:00:00Z",
                         "updatedAt": "2024-04-01T12:00:00Z",
                     }
                }
            },
        },
        **error_responses(401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def create_post_route(
    cliqueId: Annotated[UUID, Path(alias="cliqueId")],
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
    clique = await get_clique_by_id(db, str(cliqueId))
    if not clique:
        raise NotFound()
    if clique.owner_user_id != current_user.id:
        raise Forbidden()
    post = await create_post(
        db,
        str(current_user.id),
        str(cliqueId),
        data.content,
        data.status or PostStatus.DRAFT,
    )
    return post


@router.get(
    "/cliques/{cliqueId}/posts",
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
    cliqueId: Annotated[UUID, Path(alias="cliqueId")],
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
    clique = await get_clique_by_id(db, str(cliqueId))
    if not clique:
        raise NotFound()
    if clique.privacy == Privacy.PRIVATE and clique.owner_user_id != current_user.id:
        is_member = await is_member_of_clique(db, str(cliqueId), str(current_user.id))
        if not is_member:
            raise Forbidden()
    posts, next_cursor = await get_clique_posts(
        db, str(cliqueId), str(current_user.id), cursor, limit
    )
    return CursorPagePosts(items=posts, next_cursor=next_cursor)


@router.get(
    "/user/{userId}/posts",
    summary="List user posts",
    description="Paginated posts by a user visible to the current user, respecting privacy settings.",
    response_model=CursorPagePosts,
    responses={
        200: {"description": "User posts page"},
        **error_responses(401, 404),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def list_user_posts_route(
    userId: Annotated[UUID, Path(alias="userId")],
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
    posts, next_cursor = await get_user_posts(
        db, str(userId), str(current_user.id), cursor, limit
    )
    return CursorPagePosts(items=posts, next_cursor=next_cursor)


@router.get(
    "/{postId}",
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
    postId: Annotated[UUID, Path(alias="postId")],
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    post_record = await _require_post(db, postId)
    await _ensure_post_visibility(db, post_record, current_user)
    post = await get_post_by_id(db, str(postId), str(current_user.id))
    if not post:
        raise NotFound()
    return post


@router.patch(
    "/{postId}",
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
    postId: Annotated[UUID, Path(alias="postId")],
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
    post = await _require_post(db, postId)
    await _ensure_post_owner_or_clique_owner(db, post, current_user)
    updated = await update_post(db, str(postId), data.content, data.status)
    if not updated:
        raise NotFound()
    refreshed = await get_post_by_id(db, str(postId), str(current_user.id))
    return refreshed


@router.delete(
    "/{postId}",
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
    postId: Annotated[UUID, Path(alias="postId")],
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, postId)
    await _ensure_post_owner_or_clique_owner(db, post, current_user)
    await delete_post(db, str(postId))
    return Response(status_code=204)


@router.post(
    "/{postId}/like",
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
                         "likesCount": 12,
                         "commentsCount": 3,
                         "likedByMe": True,
                     }
                }
            },
        },
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def like_route(
    postId: Annotated[UUID, Path(alias="postId")],
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, postId)
    await _ensure_post_visibility(db, post, current_user)
    result = await like_post(db, str(current_user.id), str(postId))
    return result or await get_post_by_id(db, str(postId), str(current_user.id))


@router.delete(
    "/{postId}/like",
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
                         "likesCount": 11,
                         "commentsCount": 3,
                         "likedByMe": False,
                     }
                }
            },
        },
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def unlike_route(
    postId: Annotated[UUID, Path(alias="postId")],
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    post = await _require_post(db, postId)
    await _ensure_post_visibility(db, post, current_user)
    result = await unlike_post(db, str(current_user.id), str(postId))
    return result or await get_post_by_id(db, str(postId), str(current_user.id))


@router.post(
    "/{postId}/comments",
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
                         "postId": "7415722e-4e4f-4f8b-8c44-2924f905a712",
                         "userId": "93d52d58-eac4-4e74-a69d-6410a1de0970",
                         "content": "Can't wait to see the new collection!",
                         "createdAt": "2024-04-01T13:00:00Z",
                     }
                }
            },
        },
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def create_comment_route(
    postId: Annotated[UUID, Path(alias="postId")],
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
    post = await _require_post(db, postId)
    await _ensure_post_visibility(db, post, current_user)
    try:
        return await create_comment(db, str(postId), str(current_user.id), data)
    except ValueError as exc:
        raise Validation(str(exc))


@router.delete(
    "/comments/{commentId}",
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
    commentId: Annotated[UUID, Path(alias="commentId")],
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await db.get(Comment, commentId)
    if not comment or comment.deleted_at is not None:
        raise NotFound()
    post = await _require_post(db, comment.post_id)
    if str(comment.user_id) != str(current_user.id):
        await _ensure_post_owner_or_clique_owner(db, post, current_user)
    try:
        await delete_comment(db, str(commentId), str(current_user.id))
    except (ValueError, PermissionError) as exc:
        if isinstance(exc, PermissionError):
            raise Forbidden()
        raise NotFound()
    return Response(status_code=204)


async def _require_post(db: AsyncSession, postId: UUID) -> Post:
    post = await db.get(Post, postId)
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
