import asyncio
import os
import random
from datetime import datetime, time, timedelta, timezone

from faker import Faker
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models.enums import PostStatus
from app.models.post import Post, PostMedia
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

fake = Faker()

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/clique"
)
engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)


def _get_user_data():
    return [
        {
            "email": "user1@example.com",
            "username": "user1",
            "is_business_page": False,
        },
        {
            "email": "user2@example.com",
            "username": "user2",
            "is_business_page": False,
        },
        {
            "email": "user3@example.com",
            "username": "user3",
            "is_business_page": False,
        },
        {
            "email": "user4@example.com",
            "username": "user4",
            "is_business_page": True,
        },
        {
            "email": "user5@example.com",
            "username": "user5",
            "is_business_page": True,
        },
        {
            "email": "user6@example.com",
            "username": "user6",
            "is_business_page": False,
        },
        {
            "email": "user7@example.com",
            "username": "user7",
            "is_business_page": False,
        },
        {
            "email": "user8@example.com",
            "username": "user8",
            "is_business_page": True,
        },
        {
            "email": "user9@example.com",
            "username": "user9",
            "is_business_page": True,
        },
        {
            "email": "user10@example.com",
            "username": "user10",
            "is_business_page": False,
        },
    ]


async def seed() -> None:
    async with async_session() as session:
        # Create users

        users = []
        for user_data in _get_user_data():
            user = await create_user(
                session,
                email=user_data["email"],
                username=user_data["username"],
                is_business_page=user_data["is_business_page"],
                password="test",
            )
            users.append(user)

        # For reference
        user1 = users[0]
        user2 = users[1]
        user3 = users[2]
        user4 = users[3]  # business
        user5 = users[4]  # business

        # Create cliques for business users
        cliques = []
        business_users = [u for u in users if u.is_business_page]
        for bu in business_users:
            clique = await create_clique(session, bu)
            cliques.append(clique)

        clique1 = cliques[0]
        clique2 = cliques[1]

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

        # Create posts (100 posts for infinite scrolling)
        posts = []
        now = datetime.now(timezone.utc)
        for _ in range(100):
            author = random.choice(users)
            clique = random.choice(cliques)
            status = random.choice(list(PostStatus))
            # Set random created_at in last 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            created_at = now - timedelta(
                days=days_ago, hours=hours_ago, minutes=minutes_ago
            )
            post = Post(
                clique_id=clique.id,
                author_user_id=author.id,
                status=status,
                content=fake.text(max_nb_chars=240),
                created_at=created_at,
            )
            session.add(post)
            await session.flush()
            posts.append(post)

            # Sometimes add media
            if random.random() < 0.3:  # 30% chance
                media = await create_media(session, owner=author)
                post_media = PostMedia(post_id=post.id, media_id=media.id, position=0)
                session.add(post_media)

        post1 = posts[0]
        post2 = posts[1]

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

        # Create follows (25 random follows)
        created_follows = set()
        for _ in range(25):
            follower = random.choice(users)
            followee = random.choice([u for u in users if u != follower])
            if (follower.id, followee.id) not in created_follows:
                created_follows.add((follower.id, followee.id))
                await create_follow(session, follower=follower, followee=followee)

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
