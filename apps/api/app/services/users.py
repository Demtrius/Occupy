from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User


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

async def get_user_by_email_or_username(db: AsyncSession, email: str, username: str) -> User | None:
    stmt = select(User).where((User.email == email) | (User.username == username))
    return await db.scalar(stmt)

async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    return await db.get(User, user_id)