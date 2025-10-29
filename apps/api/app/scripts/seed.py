import asyncio
import os
import random
from datetime import datetime, time, timedelta, timezone
from typing import Any, Dict, List

from faker import Faker
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models.enums import PostStatus, Role, MembershipStatus
from app.models.post import Post, PostMedia
from app.models.clique import CliqueMember
from app.models.user import User, UserOccupation, CliqueOccupation, Follow, Occupation
from tests.factories import (
    create_availability,
    create_booking,
    create_chat,
    create_clique,
    create_comment,
    create_follow,
    create_like,
    create_media,
    create_message,
    create_occupation,
    create_service,
    create_user,
)

fake = Faker()

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/clique"
)
engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)


def _get_user_data() -> List[Dict[str, Any]]:
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
            existing = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            user = existing.scalar_one_or_none()
            if user is None:
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
        user6 = users[5]
        user7 = users[6]

        # Create occupations
        occupations = []
        occupation_names = [
            "Software Engineer",
            "Chef",
            "Photographer",
            "Graphic Designer",
            "Personal Trainer",
            "Hair Stylist",
            "Teacher",
            "Writer",
            "Musician",
            "Artist",
            "Mechanic",
            "Nurse",
            "Accountant",
            "Marketing Specialist",
            "Event Planner",
            "Baker",
            "Makeup Artist",
            "Nutritionist",
            "Content Creator",
        ]
        for name in occupation_names:
            # Check if occupation already exists
            existing = await session.execute(
                select(Occupation).where(Occupation.name == name)
            )
            occupation = existing.scalar_one_or_none()
            if occupation is None:
                occupation = await create_occupation(session, name=name)
            occupations.append(occupation)

        # Clique templates for seed data
        clique_templates = [
            {
                "name": "Sweet Delights Bakery",
                "description": "Hand-crafted pastries, custom cakes, and weekend baking classes.",
                "image_url": "https://images.unsplash.com/photo-1546793665-c74683f339c1",
                "occupations": ["Chef", "Baker", "Event Planner"],
            },
            {
                "name": "Luxe Lounge Salon",
                "description": "Full-service salon offering color, styling, and bridal looks.",
                "image_url": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9",
                "occupations": [
                    "Hair Stylist",
                    "Makeup Artist",
                    "Marketing Specialist",
                ],
            },
            {
                "name": "Peak Performance Coaching",
                "description": "Personal training plans, nutrition guidance, and accountability sessions.",
                "image_url": "https://images.unsplash.com/photo-1546483875-ad9014c88eba",
                "occupations": [
                    "Personal Trainer",
                    "Nutritionist",
                    "Marketing Specialist",
                ],
            },
            {
                "name": "Pixel Perfect Studio",
                "description": "Photography, retouching, and creative direction for brands.",
                "image_url": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
                "occupations": ["Photographer", "Graphic Designer", "Content Creator"],
            },
        ]

        # Create cliques for business users with curated metadata
        cliques = []
        business_users = [u for u in users if u.is_business_page]
        for index, bu in enumerate(business_users):
            template = clique_templates[index % len(clique_templates)]
            clique = await create_clique(
                session,
                bu,
                name=template["name"],
                description=template["description"],
                image_url=template["image_url"],
            )
            cliques.append(clique)

            for occupation_name in template["occupations"]:
                occupation = next(
                    (occ for occ in occupations if occ.name == occupation_name),
                    None,
                )
                if occupation is None:
                    occupation = await create_occupation(session, name=occupation_name)
                    occupations.append(occupation)

                existing = await session.execute(
                    select(CliqueOccupation).where(
                        CliqueOccupation.clique_id == clique.id,
                        CliqueOccupation.occupation_id == occupation.id,
                    )
                )
                if existing.scalar_one_or_none() is None:
                    session.add(
                        CliqueOccupation(
                            clique_id=clique.id,
                            occupation_id=occupation.id,
                        )
                    )

        clique1 = cliques[0]
        clique2 = cliques[1]

        # Assign occupations to users (1-3 random occupations per user)
        for user in users:
            num_occupations = random.randint(1, 3)
            user_occupations = random.sample(occupations, num_occupations)
            for occupation in user_occupations:
                # Check if user occupation already exists
                existing = await session.execute(
                    select(UserOccupation).where(
                        UserOccupation.user_id == user.id,
                        UserOccupation.occupation_id == occupation.id,
                    )
                )
                if existing.scalar_one_or_none() is None:
                    user_occupation = UserOccupation(
                        user_id=user.id, occupation_id=occupation.id
                    )
                    session.add(user_occupation)

        # Add members to cliques
        # Owners are already members, add some regular users as members
        regular_users = [u for u in users if not u.is_business_page]
        for clique in cliques:
            # Add 2-4 random regular users as members
            num_members = random.randint(2, 4)
            potential_members = [
                u for u in regular_users if u.id != clique.owner_user_id
            ]
            selected_members = random.sample(
                potential_members, min(num_members, len(potential_members))
            )

            for member in selected_members:
                # Check if already a member (shouldn't be, but safety check)
                existing = await session.execute(
                    select(CliqueMember).where(
                        CliqueMember.clique_id == clique.id,
                        CliqueMember.user_id == member.id,
                    )
                )
                if existing.scalar_one_or_none() is None:
                    clique_member = CliqueMember(
                        clique_id=clique.id,
                        user_id=member.id,
                        role=Role.MEMBER,
                        status=MembershipStatus.JOINED,
                    )
                    session.add(clique_member)

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

        # Add likes to posts (0-10 random likes per post)
        for post in posts:
            num_likes = random.randint(0, 10)
            if num_likes > 0:
                likers = random.sample(users, min(num_likes, len(users)))
                for liker in likers:
                    try:
                        await create_like(session, post=post, user=liker)
                    except IntegrityError:
                        # Skip if like already exists
                        pass

        # Create comments
        await create_comment(session, post=post1, author=user1)
        await create_comment(session, post=post2, author=user2)

        # Add more comments to posts (0-5 additional comments per post)
        for post in posts:
            num_additional_comments = random.randint(0, 5)
            for _ in range(num_additional_comments):
                commenter = random.choice(users)
                try:
                    await create_comment(session, post=post, author=commenter)
                except IntegrityError:
                    # Skip if comment creation fails
                    pass

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
            follow_key = (follower.id, followee.id)
            if follow_key not in created_follows:
                created_follows.add(follow_key)
                # Check if follow already exists
                existing = await session.execute(
                    select(Follow).where(
                        Follow.follower_user_id == follower.id,
                        Follow.followee_user_id == followee.id,
                    )
                )
                if existing.scalar_one_or_none() is None:
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
