from __future__ import annotations

from datetime import datetime
from typing import Iterable
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.pagination import apply_datetime_cursor, slice_results
from ..models.clique import Clique
from ..models.enums import PostStatus
from ..models.post import Comment, Post, PostLike
from ..schemas.post import Comment as CommentSchema
from ..schemas.post import CommentCreate, Post as PostSchema


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
    return await _hydrate_post(db, post, current_user_id)


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
    hydrated = [await _hydrate_post(db, post, current_user_id) for post in posts]
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
        raise ValueError("Comment body cannot be empty")
    post = await db.get(Post, post_id)
    if not post or post.deleted_at is not None:
        raise ValueError("Post not found")

    if data.parent_comment_id:
        parent = await db.get(Comment, data.parent_comment_id)
        if not parent or parent.post_id != post_id or parent.deleted_at is not None:
            raise ValueError("Invalid parent comment")

    comment = Comment(
        post_id=post_id,
        user_id=user_id,
        body=data.body,
        parent_comment_id=data.parent_comment_id,
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
) -> PostSchema:
    likes_count, comments_count = await _aggregate_counts(db, [post.id])
    liked_ids = await _liked_post_ids(db, [post.id], current_user_id)
    schema = PostSchema.model_validate(post)
    schema.likes_count = likes_count.get(post.id, 0)
    schema.comments_count = comments_count.get(post.id, 0)
    schema.liked_by_me = post.id in liked_ids
    return schema


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
