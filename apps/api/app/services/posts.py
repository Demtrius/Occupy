from __future__ import annotations

from datetime import datetime
from typing import Iterable
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.errors import Validation
from ..core.pagination import apply_datetime_cursor, slice_results
from ..models.clique import Clique, CliqueMember
from ..models.enums import FollowStatus, MembershipStatus, PostStatus, Privacy
from ..models.media import Media
from ..models.post import Comment, Post, PostLike, PostMedia
from ..models.user import Follow, User
from ..schemas.post import (
    Comment as CommentSchema,
    CommentCreate,
    Post as PostSchema,
    PostAuthorSummary,
    PostCliqueSummary,
    PostMediaItem,
)
from ..schemas.media import Media as MediaSchema


async def create_post(
    db: AsyncSession,
    author_id: str,
    clique_id: str,
    content: str,
    status: PostStatus,
) -> PostSchema:
    post = Post(
        author_user_id=author_id,
        clique_id=clique_id,
        content=content,
        status=status,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return await _hydrate_post(db, post, author_id)


async def get_post_by_id(
    db: AsyncSession, post_id: str, current_user_id: str
) -> PostSchema | None:
    post = await db.get(Post, post_id)
    if not post or post.deleted_at is not None:
        return None
    return await _hydrate_post(db, post, current_user_id, include_comments=True)


async def get_clique_posts(
    db: AsyncSession,
    clique_id: str,
    current_user_id: str,
    cursor: str | None,
    limit: int,
) -> tuple[list[PostSchema], str | None]:
    stmt = select(Post).where(
        Post.clique_id == clique_id,
        Post.status == PostStatus.POSTED,
        Post.deleted_at.is_(None),
    )
    stmt = apply_datetime_cursor(stmt, Post, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().unique().all()
    posts, next_cursor = slice_results(rows, limit)
    hydrated = await _hydrate_posts(db, posts, current_user_id)
    return hydrated, next_cursor


async def get_user_posts(
    db: AsyncSession,
    user_id: str,
    current_user_id: str,
    cursor: str | None,
    limit: int,
) -> tuple[list[PostSchema], str | None]:
    from ..models.clique import CliqueMember
    from ..models.enums import MembershipStatus, Privacy

    # Get posts by the user that are posted and not deleted
    base_stmt = select(Post).where(
        Post.author_user_id == user_id,
        Post.status == PostStatus.POSTED,
        Post.deleted_at.is_(None),
    )

    # If viewing own posts, show all
    if user_id == current_user_id:
        stmt = base_stmt
    else:
        # For other users, only show posts from public cliques or cliques where current user is a member
        public_cliques_stmt = select(Clique.id).where(Clique.privacy == Privacy.PUBLIC)
        member_cliques_stmt = select(CliqueMember.clique_id).where(
            CliqueMember.user_id == current_user_id,
            CliqueMember.status == MembershipStatus.JOINED,
        )

        allowed_clique_ids = public_cliques_stmt.union(member_cliques_stmt)
        stmt = base_stmt.where(Post.clique_id.in_(allowed_clique_ids))

    stmt = apply_datetime_cursor(stmt, Post, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().unique().all()
    posts, next_cursor = slice_results(rows, limit)
    hydrated = await _hydrate_posts(db, posts, current_user_id)
    return hydrated, next_cursor


async def get_feed_posts(
    db: AsyncSession,
    current_user_id: str,
    filter_type: str | None,
    cursor: str | None,
    limit: int,
) -> tuple[list[PostSchema], str | None]:
    # Base query for posted, not deleted posts
    base_stmt = select(Post).where(
        Post.status == PostStatus.POSTED,
        Post.deleted_at.is_(None),
    )

    if filter_type == "followings":
        # Posts from users that current user follows
        following_ids = select(Follow.followee_user_id).where(
            Follow.follower_user_id == current_user_id,
            Follow.status == FollowStatus.ACCEPTED,
        )
        stmt = base_stmt.where(Post.author_user_id.in_(following_ids))
    elif filter_type == "cliques":
        # Posts from cliques where user is a member
        member_clique_ids = select(CliqueMember.clique_id).where(
            CliqueMember.user_id == current_user_id,
            CliqueMember.status == MembershipStatus.JOINED,
        )
        stmt = base_stmt.where(Post.clique_id.in_(member_clique_ids))
    else:
        # Default: posts from public cliques or cliques where user is member
        public_cliques_stmt = select(Clique.id).where(Clique.privacy == Privacy.PUBLIC)
        member_cliques_stmt = select(CliqueMember.clique_id).where(
            CliqueMember.user_id == current_user_id,
            CliqueMember.status == MembershipStatus.JOINED,
        )
        allowed_clique_ids = public_cliques_stmt.union(member_cliques_stmt)
        stmt = base_stmt.where(Post.clique_id.in_(allowed_clique_ids))

    stmt = apply_datetime_cursor(stmt, Post, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().unique().all()
    posts, next_cursor = slice_results(rows, limit)
    hydrated = await _hydrate_posts(db, posts, current_user_id)
    return hydrated, next_cursor


async def update_post(
    db: AsyncSession, post_id: str, content: str | None, status: PostStatus | None
) -> Post | None:
    post = await db.get(Post, post_id)
    if post:
        if content is not None:
            post.content = content
        if status is not None:
            post.status = status
        await db.commit()
        await db.refresh(post)
    return post


async def delete_post(db: AsyncSession, post_id: str) -> None:
    post = await db.get(Post, post_id)
    if post:
        post.deleted_at = func.now()
        post.status = PostStatus.ARCHIVED
        await db.commit()


async def like_post(db: AsyncSession, user_id: str, post_id: str) -> PostSchema | None:
    existing = await db.scalar(
        select(PostLike).where(PostLike.user_id == user_id, PostLike.post_id == post_id)
    )
    if not existing:
        like = PostLike(user_id=user_id, post_id=post_id)
        db.add(like)
        await db.commit()
    post = await db.get(Post, post_id)
    return await _hydrate_post(db, post, user_id) if post else None


async def unlike_post(
    db: AsyncSession, user_id: str, post_id: str
) -> PostSchema | None:
    like = await db.scalar(
        select(PostLike).where(PostLike.user_id == user_id, PostLike.post_id == post_id)
    )
    if like:
        await db.delete(like)
        await db.commit()
    post = await db.get(Post, post_id)
    return await _hydrate_post(db, post, user_id) if post else None


async def create_comment(
    db: AsyncSession,
    post_id: str,
    user_id: str,
    data: CommentCreate,
) -> CommentSchema:
    if not data.body.strip():
        raise Validation("Comment body cannot be empty")
    try:
        post_uuid = UUID(post_id)
        user_uuid = UUID(user_id)
    except (TypeError, ValueError) as exc:
        raise Validation("Post not found") from exc

    post = await db.get(Post, post_uuid)
    if not post or post.deleted_at is not None:
        raise Validation("Post not found")

    parent_comment_id = None
    if data.parent_comment_id:
        try:
            parent_uuid = UUID(str(data.parent_comment_id))
        except (TypeError, ValueError) as exc:
            raise Validation("Invalid parent comment") from exc
        parent = await db.get(Comment, parent_uuid)
        if not parent or parent.post_id != post_uuid or parent.deleted_at is not None:
            raise Validation("Invalid parent comment")
        if parent.parent_comment_id is not None:
            raise Validation("Only one-level replies allowed")
        parent_comment_id = parent_uuid

    comment = Comment(
        post_id=post_uuid,
        user_id=user_uuid,
        body=data.body,
        parent_comment_id=parent_comment_id,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return CommentSchema.model_validate(comment)


async def delete_comment(
    db: AsyncSession,
    comment_id: str,
    actor_user_id: str,
) -> None:
    comment = await db.get(Comment, comment_id)
    if not comment or comment.deleted_at is not None:
        raise ValueError("Comment not found")

    if str(comment.user_id) != actor_user_id:
        post = await db.get(Post, comment.post_id)
        if not post:
            raise ValueError("Post not found")
        clique = await db.get(Clique, post.clique_id)
        if not clique or str(clique.owner_user_id) != actor_user_id:
            raise PermissionError("Cannot delete comment")

    comment.deleted_at = func.now()
    await db.commit()


def _parse_cursor(cursor: str) -> datetime:
    """Parse ISO 8601 cursor into timezone-aware datetime."""
    try:
        parsed = datetime.fromisoformat(cursor)
    except ValueError as exc:
        raise ValueError("Invalid cursor") from exc
    if parsed.tzinfo is None:
        raise ValueError("Cursor must include timezone info")
    return parsed


async def _hydrate_post(
    db: AsyncSession,
    post: Post,
    current_user_id: str,
    include_comments: bool = False,
) -> PostSchema:
    hydrated = await _hydrate_posts(
        db, [post], current_user_id, include_comments=include_comments
    )
    return hydrated[0]


async def _hydrate_posts(
    db: AsyncSession,
    posts: Iterable[Post],
    current_user_id: str,
    include_comments: bool = False,
) -> list[PostSchema]:
    post_list = list(posts)
    if not post_list:
        return []

    post_ids = [post.id for post in post_list]
    author_ids = {post.author_user_id for post in post_list}
    clique_ids = {post.clique_id for post in post_list}

    comments_map: dict[UUID, list[Comment]] = {}
    comment_user_ids: set[UUID] = set()
    if include_comments:
        comments_map = await _fetch_comments(db, post_ids)
        for comment_list in comments_map.values():
            comment_user_ids.update(comment.user_id for comment in comment_list)

    likes_count, comments_count = await _aggregate_counts(db, post_ids)
    liked_ids = await _liked_post_ids(db, post_ids, current_user_id)
    media_map = await _fetch_post_media(db, post_ids)
    author_lookup_ids = author_ids | comment_user_ids
    authors = await _fetch_users(db, author_lookup_ids)
    cliques = await _fetch_cliques(db, clique_ids)

    hydrated: list[PostSchema] = []
    for post in post_list:
        schema = PostSchema.model_validate(
            {
                "id": post.id,
                "clique_id": post.clique_id,
                "author_user_id": post.author_user_id,
                "status": post.status,
                "content_format": post.content_format,
                "content": post.content,
                "deleted_at": post.deleted_at,
                "created_at": post.created_at,
                "updated_at": post.updated_at,
                "likes_count": likes_count.get(post.id, 0),
                "comments_count": comments_count.get(post.id, 0),
                "liked_by_me": post.id in liked_ids,
                "media": [],
                "comments": [],
            }
        )

        author = authors.get(post.author_user_id)
        schema.author = PostAuthorSummary.model_validate(author) if author else None

        clique = cliques.get(post.clique_id)
        schema.clique = PostCliqueSummary.model_validate(clique) if clique else None

        media_items = media_map.get(post.id, [])
        schema.media = [
            PostMediaItem(
                id=post_media.id,
                media_id=post_media.media_id,
                position=post_media.position,
                media=MediaSchema.model_validate(media),
            )
            for post_media, media in media_items
        ]

        if include_comments:
            comment_rows = comments_map.get(post.id, [])
            schema.comments = []
            for comment in comment_rows:
                comment_schema = CommentSchema.model_validate(comment)
                comment_author = authors.get(comment.user_id)
                if comment_author:
                    comment_schema.author = PostAuthorSummary.model_validate(
                        comment_author
                    )
                schema.comments.append(comment_schema)

        hydrated.append(schema)
    return hydrated


async def _fetch_post_media(
    db: AsyncSession,
    post_ids: Iterable[UUID],
) -> dict[UUID, list[tuple[PostMedia, Media]]]:
    ids = list(post_ids)
    if not ids:
        return {}
    stmt = (
        select(PostMedia, Media)
        .join(Media, PostMedia.media_id == Media.id)
        .where(PostMedia.post_id.in_(ids))
        .order_by(PostMedia.post_id, PostMedia.position)
    )
    result = await db.execute(stmt)
    media_map: dict[UUID, list[tuple[PostMedia, Media]]] = {}
    for post_media, media in result.all():
        media_map.setdefault(post_media.post_id, []).append((post_media, media))
    return media_map


async def _fetch_comments(
    db: AsyncSession,
    post_ids: Iterable[UUID],
) -> dict[UUID, list[Comment]]:
    ids = list(post_ids)
    if not ids:
        return {}
    stmt = (
        select(Comment)
        .where(Comment.post_id.in_(ids), Comment.deleted_at.is_(None))
        .order_by(Comment.post_id, Comment.created_at)
    )
    result = await db.execute(stmt)
    comments_map: dict[UUID, list[Comment]] = {}
    for comment in result.scalars().all():
        comments_map.setdefault(comment.post_id, []).append(comment)
    return comments_map


async def _fetch_users(
    db: AsyncSession,
    user_ids: Iterable[UUID],
) -> dict[UUID, User]:
    ids = list(user_ids)
    if not ids:
        return {}
    stmt = select(User).where(User.id.in_(ids))
    result = await db.execute(stmt)
    return {user.id: user for user in result.scalars().all()}


async def _fetch_cliques(
    db: AsyncSession,
    clique_ids: Iterable[UUID],
) -> dict[UUID, Clique]:
    ids = list(clique_ids)
    if not ids:
        return {}
    stmt = select(Clique).where(Clique.id.in_(ids))
    result = await db.execute(stmt)
    return {clique.id: clique for clique in result.scalars().all()}


async def _aggregate_counts(
    db: AsyncSession, post_ids: Iterable[UUID]
) -> tuple[dict[UUID, int], dict[UUID, int]]:
    ids = list(post_ids)
    if not ids:
        return {}, {}
    likes_stmt = (
        select(PostLike.post_id, func.count())
        .where(PostLike.post_id.in_(ids))
        .group_by(PostLike.post_id)
    )
    comments_stmt = (
        select(Comment.post_id, func.count())
        .where(Comment.post_id.in_(ids), Comment.deleted_at.is_(None))
        .group_by(Comment.post_id)
    )
    likes = {row[0]: row[1] for row in (await db.execute(likes_stmt)).all()}
    comments = {row[0]: row[1] for row in (await db.execute(comments_stmt)).all()}
    return likes, comments


async def _liked_post_ids(
    db: AsyncSession, post_ids: Iterable[UUID], user_id: str
) -> set[UUID]:
    ids = list(post_ids)
    if not ids:
        return set()
    stmt = select(PostLike.post_id).where(
        PostLike.post_id.in_(ids),
        PostLike.user_id == user_id,
    )
    return set(await db.scalars(stmt))
