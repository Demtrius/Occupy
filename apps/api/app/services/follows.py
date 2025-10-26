from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.pagination import apply_datetime_cursor, slice_results
from ..models.enums import FollowStatus
from ..models.user import Follow
from ..schemas.user import Follow as FollowSchema
from ..services.notifications import notify_follow


def _to_schema(follow: Follow) -> FollowSchema:
    return FollowSchema.model_validate(follow)


async def follow_user(
    db: AsyncSession, follower_id: str, followee_id: str
) -> FollowSchema:
    if follower_id == followee_id:
        raise ValueError("Cannot follow yourself")

    # Blocked in either direction?
    blocked = await db.scalar(
        select(Follow).where(
            (
                (Follow.follower_user_id == followee_id)
                & (Follow.followee_user_id == follower_id)
            )
            | (
                (Follow.follower_user_id == follower_id)
                & (Follow.followee_user_id == followee_id)
            ),
            Follow.status == FollowStatus.BLOCKED,
        )
    )
    if blocked and blocked.follower_user_id != follower_id:
        raise ValueError("Cannot follow blocked user")

    existing = await db.scalar(
        select(Follow).where(
            Follow.follower_user_id == follower_id,
            Follow.followee_user_id == followee_id,
        )
    )
    if existing:
        return _to_schema(existing)

    from ..models.user import User

    followee = await db.get(User, followee_id)
    if not followee:
        raise ValueError("User not found")

    status = (
        FollowStatus.PENDING if followee.is_private_account else FollowStatus.ACCEPTED
    )

    follow = Follow(
        follower_user_id=follower_id,
        followee_user_id=followee_id,
        status=status,
    )
    db.add(follow)
    await db.commit()
    await db.refresh(follow)
    await notify_follow(db, followee_id, follower_id, follow.status.value)
    return _to_schema(follow)


async def unfollow_user(db: AsyncSession, follower_id: str, followee_id: str) -> bool:
    stmt = select(Follow).where(
        Follow.follower_user_id == follower_id,
        Follow.followee_user_id == followee_id,
    )
    follow = await db.scalar(stmt)
    if not follow:
        return False
    await db.delete(follow)
    await db.commit()
    return True


async def approve_follow(
    db: AsyncSession, followee_id: str, follower_id: str
) -> FollowSchema | None:
    stmt = select(Follow).where(
        Follow.follower_user_id == follower_id,
        Follow.followee_user_id == followee_id,
    )
    follow = await db.scalar(stmt)
    if not follow:
        return None
    if follow.status == FollowStatus.ACCEPTED:
        return _to_schema(follow)
    if follow.status != FollowStatus.PENDING:
        raise ValueError("Cannot approve non-pending follow")
    follow.status = FollowStatus.ACCEPTED
    await db.commit()
    await db.refresh(follow)
    await notify_follow(db, followee_id, follower_id, follow.status.value)
    return _to_schema(follow)


async def reject_follow(db: AsyncSession, followee_id: str, follower_id: str) -> bool:
    stmt = select(Follow).where(
        Follow.follower_user_id == follower_id,
        Follow.followee_user_id == followee_id,
    )
    follow = await db.scalar(stmt)
    if not follow:
        return False
    if follow.status == FollowStatus.PENDING:
        await db.delete(follow)
        await db.commit()
        return True
    return False


async def block_user(
    db: AsyncSession, blocker_id: str, blocked_id: str
) -> FollowSchema:
    delete_stmt = delete(Follow).where(
        (
            (Follow.follower_user_id == blocker_id)
            & (Follow.followee_user_id == blocked_id)
        )
        | (
            (Follow.follower_user_id == blocked_id)
            & (Follow.followee_user_id == blocker_id)
        )
    )
    await db.execute(delete_stmt)

    block = await db.scalar(
        select(Follow).where(
            Follow.follower_user_id == blocker_id,
            Follow.followee_user_id == blocked_id,
            Follow.status == FollowStatus.BLOCKED,
        )
    )
    if block:
        await db.commit()
        return _to_schema(block)

    block = Follow(
        follower_user_id=blocker_id,
        followee_user_id=blocked_id,
        status=FollowStatus.BLOCKED,
    )
    db.add(block)
    await db.commit()
    await db.refresh(block)
    return _to_schema(block)


async def unblock_user(db: AsyncSession, blocker_id: str, blocked_id: str) -> bool:
    stmt = select(Follow).where(
        Follow.follower_user_id == blocker_id,
        Follow.followee_user_id == blocked_id,
        Follow.status == FollowStatus.BLOCKED,
    )
    follow = await db.scalar(stmt)
    if not follow:
        return False
    await db.delete(follow)
    await db.commit()
    return True


async def get_followers(
    db: AsyncSession, user_id: str, cursor: str | None, limit: int
) -> tuple[list[FollowSchema], str | None]:
    stmt = select(Follow).where(
        Follow.followee_user_id == user_id,
        Follow.status == FollowStatus.ACCEPTED,
    )
    stmt = apply_datetime_cursor(stmt, Follow, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    items, next_cursor = slice_results(rows, limit)
    return [_to_schema(item) for item in items], next_cursor


async def get_following(
    db: AsyncSession, user_id: str, cursor: str | None, limit: int
) -> tuple[list[FollowSchema], str | None]:
    stmt = select(Follow).where(
        Follow.follower_user_id == user_id,
        Follow.status == FollowStatus.ACCEPTED,
    )
    stmt = apply_datetime_cursor(stmt, Follow, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    items, next_cursor = slice_results(rows, limit)
    return [_to_schema(item) for item in items], next_cursor


async def count_followers(db: AsyncSession, user_id: str) -> int:
    stmt = select(func.count(Follow.id)).where(
        Follow.followee_user_id == user_id,
        Follow.status == FollowStatus.ACCEPTED,
    )
    result = await db.scalar(stmt)
    return result or 0


async def count_following(db: AsyncSession, user_id: str) -> int:
    stmt = select(func.count(Follow.id)).where(
        Follow.follower_user_id == user_id,
        Follow.status == FollowStatus.ACCEPTED,
    )
    result = await db.scalar(stmt)
    return result or 0
