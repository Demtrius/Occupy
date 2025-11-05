import asyncio
import getpass
import os

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.auth import hash_password
from app.db.session import async_session_maker as async_session
from app.models.user import User
from app.services.users import create_user, get_user_by_email_or_username

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/clique"
)
engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def main():
    print("Creating a superuser...")
    username = input("Username: ")
    email = input("Email: ")
    password = getpass.getpass("Password: ")

    async with async_session() as session:
        existing_user = await get_user_by_email_or_username(session, email, username)

        if existing_user:
            print("User with this email or username already exists.")
            make_admin = input("Do you want to make this user an admin? (y/N): ")
            if make_admin.lower() in ["y", "yes"]:
                existing_user.is_admin = True
                await session.commit()
                print(f"User '{username}' is now an admin.")
            else:
                print("Operation cancelled.")
        else:
            await create_user(
                session,
                email=email,
                username=username,
                password_hash=hash_password(password),
                full_name=username,  # Using username as full_name
                bio=None,
                profile_image_url=None,
                is_admin=True,
                is_active=True,
                is_private_account=False,
                is_business_page=False,
            )
            print(f"Superuser '{username}' created successfully.")


if __name__ == "__main__":
    asyncio.run(main())
