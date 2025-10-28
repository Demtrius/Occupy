from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.pagination import (
    apply_datetime_cursor,
    encode_datetime_cursor,
    slice_results,
    CursorEntity,
)
from ..models.enums import FollowStatus
from ..models.user import Follow, User
from ..schemas.user import Follow as FollowSchema, UserFollow as UserFollowSchema
from ..services.notifications import notify_follow


def _to_schema(follow: Follow) -> FollowSchema:
    return FollowSchema.model_validate(follow)


def _user_to_schema(user: User) -> UserFollowSchema:
    return UserFollowSchema.model_validate(
        {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "profile_image_url": user.profile_image_url,
            "is_business_page": user.is_business_page,
            "bio": user.bio,
        }
    )


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

    from ..models.user import User

    followee = await db.get(User, followee_id)
    if not followee:
        raise ValueError("User not found")

    existing = await db.scalar(
        select(Follow).where(
            Follow.follower_user_id == follower_id,
            Follow.followee_user_id == followee_id,
        )
    )
    if existing:
        # Return existing follow with user data
        follow_dict = {
            "id": existing.id,
            "follower_user_id": existing.follower_user_id,
            "followee_user_id": existing.followee_user_id,
            "status": existing.status,
            "created_at": existing.created_at,
            "user": _user_to_schema(followee),
        }
        return FollowSchema.model_validate(follow_dict)

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

    # Return follow with user data
    follow_dict = {
        "id": follow.id,
        "follower_user_id": follow.follower_user_id,
        "followee_user_id": follow.followee_user_id,
        "status": follow.status,
        "created_at": follow.created_at,
        "user": _user_to_schema(followee),
    }
    return FollowSchema.model_validate(follow_dict)


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

    # Get follower user data
    follower_user = await db.get(User, follower_id)
    if not follower_user:
        return None

    if follow.status == FollowStatus.ACCEPTED:
        follow_dict = {
            "id": follow.id,
            "follower_user_id": follow.follower_user_id,
            "followee_user_id": follow.followee_user_id,
            "status": follow.status,
            "created_at": follow.created_at,
            "user": _user_to_schema(follower_user),
        }
        return FollowSchema.model_validate(follow_dict)

    if follow.status != FollowStatus.PENDING:
        raise ValueError("Cannot approve non-pending follow")
    follow.status = FollowStatus.ACCEPTED
    await db.commit()
    await db.refresh(follow)
    await notify_follow(db, followee_id, follower_id, follow.status.value)

    follow_dict = {
        "id": follow.id,
        "follower_user_id": follow.follower_user_id,
        "followee_user_id": follow.followee_user_id,
        "status": follow.status,
        "created_at": follow.created_at,
        "user": _user_to_schema(follower_user),
    }
    return FollowSchema.model_validate(follow_dict)


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

    # Get blocked user data
    blocked_user = await db.get(User, blocked_id)
    if not blocked_user:
        raise ValueError("User not found")

    block = await db.scalar(
        select(Follow).where(
            Follow.follower_user_id == blocker_id,
            Follow.followee_user_id == blocked_id,
            Follow.status == FollowStatus.BLOCKED,
        )
    )
    if block:
        await db.commit()
        follow_dict = {
            "id": block.id,
            "follower_user_id": block.follower_user_id,
            "followee_user_id": block.followee_user_id,
            "status": block.status,
            "created_at": block.created_at,
            "user": _user_to_schema(blocked_user),
        }
        return FollowSchema.model_validate(follow_dict)

    block = Follow(
        follower_user_id=blocker_id,
        followee_user_id=blocked_id,
        status=FollowStatus.BLOCKED,
    )
    db.add(block)
    await db.commit()
    await db.refresh(block)

    follow_dict = {
        "id": block.id,
        "follower_user_id": block.follower_user_id,
        "followee_user_id": block.followee_user_id,
        "status": block.status,
        "created_at": block.created_at,
        "user": _user_to_schema(blocked_user),
    }
    return FollowSchema.model_validate(follow_dict)


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
    # Get follow records with pagination
    stmt = select(Follow).where(
        Follow.followee_user_id == user_id,
        Follow.status == FollowStatus.ACCEPTED,
    )
    stmt = apply_datetime_cursor(stmt, Follow, cursor, limit)
    result = await db.execute(stmt)
    follow_rows = result.scalars().all()

    # Apply pagination manually
    follows = follow_rows[:limit]
    next_cursor = None
    if len(follow_rows) > limit:
        next_cursor = encode_datetime_cursor(
            follow_rows[limit - 1].created_at, follow_rows[limit - 1].id
        )

    if not follows:
        return [], next_cursor

    # Get user data for followers
    user_ids = [f.follower_user_id for f in follows]
    users_stmt = select(User).where(User.id.in_(user_ids))
    users_result = await db.execute(users_stmt)
    users = {u.id: u for u in users_result.scalars().all()}

    # Combine follow and user data
    follows_with_users = []
    for follow in follows:
        user = users.get(follow.follower_user_id)
        if user:
            follow_dict = {
                "id": follow.id,
                "follower_user_id": follow.follower_user_id,
                "followee_user_id": follow.followee_user_id,
                "status": follow.status,
                "created_at": follow.created_at,
                "user": _user_to_schema(user),
            }
            follows_with_users.append(FollowSchema.model_validate(follow_dict))

    return follows_with_users, next_cursor


async def get_following(
    db: AsyncSession, user_id: str, cursor: str | None, limit: int
) -> tuple[list[FollowSchema], str | None]:
    # Get follow records with pagination
    stmt = select(Follow).where(
        Follow.follower_user_id == user_id,
        Follow.status == FollowStatus.ACCEPTED,
    )
    stmt = apply_datetime_cursor(stmt, Follow, cursor, limit)
    result = await db.execute(stmt)
    follow_rows = result.scalars().all()

    # Apply pagination manually
    follows = follow_rows[:limit]
    next_cursor = None
    if len(follow_rows) > limit:
        next_cursor = encode_datetime_cursor(
            follow_rows[limit - 1].created_at, follow_rows[limit - 1].id
        )

    if not follows:
        return [], next_cursor

    # Get user data for followees
    user_ids = [f.followee_user_id for f in follows]
    users_stmt = select(User).where(User.id.in_(user_ids))
    users_result = await db.execute(users_stmt)
    users = {u.id: u for u in users_result.scalars().all()}

    # Combine follow and user data
    follows_with_users = []
    for follow in follows:
        user = users.get(follow.followee_user_id)
        if user:
            follow_dict = {
                "id": follow.id,
                "follower_user_id": follow.follower_user_id,
                "followee_user_id": follow.followee_user_id,
                "status": follow.status,
                "created_at": follow.created_at,
                "user": _user_to_schema(user),
            }
            follows_with_users.append(FollowSchema.model_validate(follow_dict))

    return follows_with_users, next_cursor


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


async def get_following_status(
    db: AsyncSession, follower_id: str, followee_id: str
) -> dict[str, bool]:
    stmt = select(Follow).where(
        Follow.follower_user_id == follower_id,
        Follow.followee_user_id == followee_id,
    )
    follow = await db.scalar(stmt)
    if not follow:
        return {"is_following": False, "is_follow_requested": False}
    return {
        "is_following": follow.status == FollowStatus.ACCEPTED,
        "is_follow_requested": follow.status == FollowStatus.PENDING,
    }
