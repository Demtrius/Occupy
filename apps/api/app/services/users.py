from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.pagination import apply_datetime_cursor, slice_results
from ..models.enums import FollowStatus
from ..models.user import Follow, Occupation, User


async def create_user(
    db: AsyncSession,
    email: str,
    username: str,
    password_hash: str,
    full_name: str | None,
    bio: str | None,
    profile_image_url: str | None,
    is_admin: bool,
    is_active: bool,
    is_private_account: bool,
    is_business_page: bool,
) -> User:
    user = User(
        email=email,
        username=username,
        password_hash=password_hash,
        full_name=full_name,
        bio=bio,
        profile_image_url=profile_image_url,
        is_admin=is_admin,
        is_active=is_active,
        is_private_account=is_private_account,
        is_business_page=is_business_page,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_user_by_email_or_username(
    db: AsyncSession, email: str, username: str
) -> User | None:
    stmt = select(User).where((User.email == email) | (User.username == username))
    return await db.scalar(stmt)


async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    return await db.get(User, user_id)


async def update_user_profile(
    db: AsyncSession,
    user: User,
    updates: dict[str, Any],
) -> User:
    for field, value in updates.items():
        setattr(user, field, value)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def search_users(
    db: AsyncSession,
    actor_user_id: str,
    query: str,
    occupation_id: str | UUID | None,
    cursor: str | None,
    limit: int,
    *,
    descending: bool,
) -> tuple[list[User], str | None]:
    stmt = select(User).where(User.is_active.is_(True))

    if query:
        like_token = f"%{query.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.username).like(like_token),
                func.lower(func.coalesce(User.full_name, "")).like(like_token),
                func.lower(User.email).like(like_token),
            )
        )

    if occupation_id:
        stmt = stmt.join(User.occupations).where(Occupation.id == occupation_id)

    if actor_user_id:
        blocked = (
            select(Follow.id)
            .where(
                (
                    (Follow.follower_user_id == actor_user_id)
                    & (Follow.followee_user_id == User.id)
                )
                | (
                    (Follow.follower_user_id == User.id)
                    & (Follow.followee_user_id == actor_user_id)
                ),
                Follow.status == FollowStatus.BLOCKED,
            )
            .correlate(User)
            .exists()
        )
        visible = (
            select(Follow.id)
            .where(
                Follow.follower_user_id == actor_user_id,
                Follow.followee_user_id == User.id,
                Follow.status == FollowStatus.ACCEPTED,
            )
            .correlate(User)
            .exists()
        )
        stmt = stmt.where(~blocked).where(
            or_(User.is_private_account.is_(False), User.id == actor_user_id, visible)
        )

    stmt = apply_datetime_cursor(stmt, User, cursor, limit, descending=descending)
    result = await db.execute(stmt)
    rows = result.scalars().unique().all()
    return slice_results(rows, limit)
