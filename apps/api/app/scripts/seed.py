import asyncio
import os
from datetime import datetime, time, timedelta, timezone

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from tests.factories import (
    create_availability,
    create_booking,
    create_chat,
    create_clique,
    create_comment,
    create_follow,
    create_media,
    create_message,
    create_post,
    create_service,
    create_user,
)

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/clique"
)
engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def seed() -> None:
    async with async_session() as session:
        # Create users
        user1 = await create_user(
            session, username="alice", email="alice@example.com", password="test"
        )
        user2 = await create_user(
            session, username="bob", email="bob@example.com", password="test"
        )
        user3 = await create_user(
            session, username="charlie", email="charlie@example.com", password="test"
        )
        user4 = await create_user(
            session,
            username="diana",
            email="diana@example.com",
            is_business_page=True,
            password="test",
        )
        user5 = await create_user(
            session,
            username="eve",
            email="eve@example.com",
            is_business_page=True,
            password="test",
        )

        # Create cliques
        clique1 = await create_clique(session, user4, name="Alice's Bakery")
        clique2 = await create_clique(session, user5, name="Eve's Salon")

        # Add members to cliques
        # Already owner, add others
        # For simplicity, just owners

        # Create services
        service1 = await create_service(session, clique1, title="Cupcake Baking Class")
        await create_service(session, clique1, title="Custom Cake Order")
        service3 = await create_service(session, clique2, title="Haircut")
        await create_service(session, clique2, title="Manicure")

        # Create availabilities
        await create_availability(
            session,
            clique=clique1,
            is_recurring=True,
            day_of_week=1,
            start_time=time(9, 0),
            end_time=time(17, 0),
        )
        await create_availability(
            session,
            clique=clique2,
            is_recurring=True,
            day_of_week=2,
            start_time=time(10, 0),
            end_time=time(18, 0),
        )

        # Create posts
        post1 = await create_post(session, clique=clique1, author=user4)
        post2 = await create_post(session, clique=clique2, author=user5)
        await create_post(session, clique=clique1, author=user1)

        # Create comments
        await create_comment(session, post=post1, author=user1)
        await create_comment(session, post=post2, author=user2)

        # Create media
        await create_media(session, owner=user4)
        await create_media(session, owner=user5)

        # Create bookings
        start_time = datetime.now(timezone.utc) + timedelta(days=1)
        await create_booking(session, service=service1, user=user1, start=start_time)
        await create_booking(
            session, service=service3, user=user2, start=start_time + timedelta(hours=2)
        )

        # Create follows
        await create_follow(session, follower=user1, followee=user2)
        await create_follow(session, follower=user2, followee=user4)

        # Create chats and messages
        chat1 = await create_chat(session, business=user4, client=user1)
        await create_message(session, chat=chat1, sender=user1)
        await create_message(session, chat=chat1, sender=user4)

        chat2 = await create_chat(session, business=user5, client=user3)
        await create_message(session, chat=chat2, sender=user3)

        await session.commit()
        print("Seeded sample data successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
