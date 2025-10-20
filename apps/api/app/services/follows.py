from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.enums import FollowStatus
from ..models.user import Follow


async def follow_user(db: AsyncSession, follower_id: str, followee_id: str) -> Follow:
    # Check if already following or blocked
    existing = await db.scalar(
        select(Follow).where(
            ((Follow.follower_user_id == follower_id) & (Follow.followee_user_id == followee_id)) |
            ((Follow.follower_user_id == followee_id) & (Follow.followee_user_id == follower_id) & (Follow.status == FollowStatus.BLOCKED))
        )
    )
    if existing:
        if existing.status == FollowStatus.BLOCKED:
            raise ValueError("Cannot follow blocked user")
        elif existing.status in [FollowStatus.ACCEPTED, FollowStatus.PENDING]:
            raise ValueError("Already following")

    # Check followee's privacy (assuming User model has is_private)
    from ..models.user import User
    followee = await db.get(User, followee_id)
    if not followee:
        raise ValueError("User not found")

    status = FollowStatus.PENDING if followee.is_private else FollowStatus.ACCEPTED

    follow = Follow(
        follower_user_id=follower_id,
        followee_user_id=followee_id,
        status=status,
    )
    db.add(follow)
    await db.commit()
    await db.refresh(follow)
    return follow


async def unfollow_user(db: AsyncSession, follower_id: str, followee_id: str) -> None:
    stmt = select(Follow).where(
        Follow.follower_user_id == follower_id,
        Follow.followee_user_id == followee_id,
    )
    follow = await db.scalar(stmt)
    if follow:
        await db.delete(follow)
        await db.commit()


async def approve_follow(db: AsyncSession, followee_id: str, follower_id: str) -> None:
    stmt = select(Follow).where(
        Follow.follower_user_id == follower_id,
        Follow.followee_user_id == followee_id,
        Follow.status == FollowStatus.PENDING,
    )
    follow = await db.scalar(stmt)
    if follow:
        follow.status = FollowStatus.ACCEPTED
        await db.commit()


async def reject_follow(db: AsyncSession, followee_id: str, follower_id: str) -> None:
    stmt = select(Follow).where(
        Follow.follower_user_id == follower_id,
        Follow.followee_user_id == followee_id,
        Follow.status == FollowStatus.PENDING,
    )
    follow = await db.scalar(stmt)
    if follow:
        await db.delete(follow)
        await db.commit()


async def block_user(db: AsyncSession, blocker_id: str, blocked_id: str) -> None:
    # Remove existing follows in both directions
    delete_stmt = delete(Follow).where(
        ((Follow.follower_user_id == blocker_id) & (Follow.followee_user_id == blocked_id)) |
        ((Follow.follower_user_id == blocked_id) & (Follow.followee_user_id == blocker_id))
    )
    await db.execute(delete_stmt)

    follow = Follow(
        follower_user_id=blocker_id,
        followee_user_id=blocked_id,
        status=FollowStatus.BLOCKED,
    )
    db.add(follow)
    await db.commit()


async def unblock_user(db: AsyncSession, blocker_id: str, blocked_id: str) -> None:
    stmt = select(Follow).where(
        Follow.follower_user_id == blocker_id,
        Follow.followee_user_id == blocked_id,
        Follow.status == FollowStatus.BLOCKED,
    )
    follow = await db.scalar(stmt)
    if follow:
        await db.delete(follow)
        await db.commit()


async def get_followers(db: AsyncSession, user_id: str, cursor: str | None, limit: int):
    stmt = select(Follow).where(
        Follow.followee_user_id == user_id,
        Follow.status == FollowStatus.ACCEPTED,
    )
    if cursor:
        stmt = stmt.where(Follow.id > cursor)
    stmt = stmt.order_by(Follow.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_following(db: AsyncSession, user_id: str, cursor: str | None, limit: int):
    stmt = select(Follow).where(
        Follow.follower_user_id == user_id,
        Follow.status == FollowStatus.ACCEPTED,
    )
    if cursor:
        stmt = stmt.where(Follow.id > cursor)
    stmt = stmt.order_by(Follow.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()