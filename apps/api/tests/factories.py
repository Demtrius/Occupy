from __future__ import annotations

from datetime import date as DateType
from datetime import datetime, timedelta, timezone
from datetime import time as TimeType
from typing import Optional
from uuid import UUID

from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import hash_password
from app.models.availability import Availability
from app.models.booking import Booking
from app.models.chat import Chat, Message
from app.models.clique import Clique, CliqueMember
from app.models.enums import (
    BookingStatus,
    MembershipStatus,
    PostStatus,
    Privacy,
    Role,
)
from app.models.media import Media
from app.models.post import Comment, Post
from app.models.service import Service
from app.models.user import Follow, User

fake = Faker()


async def create_user(
    db: AsyncSession,
    *,
    email: Optional[str] = None,
    username: Optional[str] = None,
    password: str = "Passw0rd!",
    is_business_page: bool = False,
    is_private_account: bool = False,
    is_admin: bool = False,
    is_active: bool = True,
) -> User:
    user = User(
        email=email or fake.unique.email(),
        username=username or fake.unique.user_name(),
        full_name=fake.name(),
        bio=fake.text(max_nb_chars=120),
        profile_image_url=fake.image_url(),
        is_admin=is_admin,
        is_active=is_active,
        is_private_account=is_private_account,
        is_business_page=is_business_page,
        password_hash=hash_password(password),
    )
    db.add(user)
    await db.flush()
    return user


async def create_clique(
    db: AsyncSession,
    owner: User,
    *,
    name: Optional[str] = None,
    privacy: Privacy = Privacy.PUBLIC,
    timezone: str = "UTC",
    cancellation_cutoff_hours: int = 24,
) -> Clique:
    clique = Clique(
        owner_user_id=owner.id,
        name=name or fake.company(),
        description=fake.bs(),
        privacy=privacy,
        timezone=timezone,
        cancellation_cutoff_hours=cancellation_cutoff_hours,
    )
    db.add(clique)
    await db.flush()

    membership = CliqueMember(
        clique_id=clique.id,
        user_id=owner.id,
        role=Role.OWNER,
        status=MembershipStatus.JOINED,
    )
    db.add(membership)
    await db.flush()
    return clique


async def create_service(
    db: AsyncSession,
    clique: Clique,
    *,
    title: Optional[str] = None,
    duration_minutes: int = 60,
    price_minor: int = 1000,
    buffer_minutes: int = 0,
) -> Service:
    service = Service(
        clique_id=clique.id,
        title=title or fake.catch_phrase(),
        description=fake.text(max_nb_chars=160),
        price_minor=price_minor,
        duration_minutes=duration_minutes,
        buffer_minutes=buffer_minutes,
        currency="USD",
        is_active=True,
    )
    db.add(service)
    await db.flush()
    return service


async def create_availability(
    db: AsyncSession,
    *,
    clique: Clique,
    is_recurring: bool = False,
    date: Optional[DateType] = None,
    day_of_week: Optional[int] = None,
    start_time: Optional[TimeType] = None,
    end_time: Optional[TimeType] = None,
    valid_from: Optional[DateType] = None,
    valid_until: Optional[DateType] = None,
    timezone_str: str = "UTC",
) -> Availability:
    start = start_time or TimeType(hour=9, minute=0)
    if end_time is not None:
        end = end_time
    else:
        end_dt = datetime.combine(DateType.today(), start) + timedelta(hours=1)
        end = end_dt.time()
    if end <= start:
        raise ValueError("end_time must be after start_time")

    if is_recurring:
        if day_of_week is None:
            day_of_week = 0
        availability = Availability(
            clique_id=clique.id,
            is_recurring=True,
            day_of_week=day_of_week,
            date=None,
            start_time=start,
            end_time=end,
            valid_from=valid_from,
            valid_until=valid_until,
            timezone=timezone_str,
        )
    else:
        availability = Availability(
            clique_id=clique.id,
            is_recurring=False,
            date=date or DateType.today(),
            day_of_week=None,
            start_time=start,
            end_time=end,
            valid_from=valid_from,
            valid_until=valid_until,
            timezone=timezone_str,
        )

    db.add(availability)
    await db.flush()
    return availability


async def create_post(
    db: AsyncSession,
    *,
    clique: Clique,
    author: User,
    status: PostStatus = PostStatus.POSTED,
) -> Post:
    post = Post(
        clique_id=clique.id,
        author_user_id=author.id,
        status=status,
        content=fake.text(max_nb_chars=240),
    )
    db.add(post)
    await db.flush()
    return post


async def create_comment(
    db: AsyncSession,
    *,
    post: Post,
    author: User,
    body: Optional[str] = None,
    parent_comment_id: Optional[UUID] = None,
    deleted: bool = False,
) -> Comment:
    comment = Comment(
        post_id=post.id,
        user_id=author.id,
        parent_comment_id=parent_comment_id,
        body=body or fake.sentence(),
    )
    if deleted:
        comment.deleted_at = datetime.now(timezone.utc)
    db.add(comment)
    await db.flush()
    return comment


async def create_media(
    db: AsyncSession,
    *,
    owner: User,
    mime: str = "image/jpeg",
) -> Media:
    media = Media(
        owner_user_id=owner.id,
        url=f"https://cdn.example.com/{fake.file_name()}",
        mime=mime,
        size_bytes=1024,
        meta={"purpose": "test"},
    )
    db.add(media)
    await db.flush()
    return media


async def create_booking(
    db: AsyncSession,
    *,
    service: Service,
    user: User,
    start: Optional[datetime] = None,
    status: BookingStatus = BookingStatus.PENDING,
    idempotency_key: Optional[str] = None,
) -> Booking:
    start_ts = start or datetime.now(timezone.utc).replace(microsecond=0)
    end_ts = start_ts + timedelta(minutes=service.duration_minutes)
    booking = Booking(
        service_id=service.id,
        clique_id=service.clique_id,
        user_id=user.id,
        start_ts=start_ts,
        end_ts=end_ts,
        status=status,
        idempotency_key=idempotency_key,
    )
    db.add(booking)
    await db.flush()
    return booking


async def create_follow(
    db: AsyncSession,
    *,
    follower: User,
    followee: User,
) -> Follow:
    follow = Follow(
        follower_user_id=follower.id,
        followee_user_id=followee.id,
    )
    db.add(follow)
    await db.flush()
    return follow


async def create_chat(
    db: AsyncSession,
    *,
    business: User,
    client: User,
) -> Chat:
    chat = Chat(
        business_user_id=business.id,
        client_user_id=client.id,
    )
    db.add(chat)
    await db.flush()
    return chat


async def create_message(
    db: AsyncSession,
    *,
    chat: Chat,
    sender: User,
    body: Optional[str] = None,
) -> Message:
    message = Message(
        chat_id=chat.id,
        sender_user_id=sender.id,
        body=body or fake.sentence(),
    )
    db.add(message)
    await db.flush()
    return message
