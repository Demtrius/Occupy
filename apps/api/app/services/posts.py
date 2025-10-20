from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.enums import PostStatus
from ..models.post import Post, PostLike


async def create_post(
    db: AsyncSession,
    author_id: str,
    clique_id: str,
    content: str,
    status: PostStatus,
) -> Post:
    post = Post(
        author_id=author_id,
        clique_id=clique_id,
        content=content,
        status=status,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


async def get_post_by_id(db: AsyncSession, post_id: str) -> Post | None:
    return await db.get(Post, post_id)


async def get_clique_posts(db: AsyncSession, clique_id: str, cursor: str | None, limit: int):
    stmt = select(Post).where(Post.clique_id == clique_id, Post.status == PostStatus.POSTED)
    if cursor:
        stmt = stmt.where(Post.id > cursor)
    stmt = stmt.order_by(Post.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def update_post(db: AsyncSession, post_id: str, content: str | None, status: PostStatus | None) -> Post | None:
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
        post.status = PostStatus.DELETED
        await db.commit()


async def like_post(db: AsyncSession, user_id: str, post_id: str) -> None:
    existing = await db.scalar(select(PostLike).where(PostLike.user_id == user_id, PostLike.post_id == post_id))
    if not existing:
        like = PostLike(user_id=user_id, post_id=post_id)
        db.add(like)
        await db.commit()


async def unlike_post(db: AsyncSession, user_id: str, post_id: str) -> None:
    like = await db.scalar(select(PostLike).where(PostLike.user_id == user_id, PostLike.post_id == post_id))
    if like:
        await db.delete(like)
        await db.commit()