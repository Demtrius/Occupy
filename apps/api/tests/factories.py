from typing import Optional

from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import hash_password
from app.models.availability import Availability
from app.models.booking import Booking
from app.models.chat import Chat
from app.models.clique import Clique, CliqueMember
from app.models.media import Media
from app.models.notification import Notification
from app.models.post import Comment, Post, PostLike
from app.models.review import Review
from app.models.service import Service
from app.models.user import User

fake = Faker()


async def create_user(
    db: AsyncSession,
    *,
    email: Optional[str] = None,
    username: Optional[str] = None,
    password: str = "password123",
    is_business_page: bool = False,
    is_private_account: bool = False,
    is_admin: bool = False,
) -> User:
    user = User(
        email=email or fake.email(),
        username=username or fake.user_name(),
        password_hash=hash_password(password),
        is_business_page=is_business_page,
        is_private_account=is_private_account,
        is_admin=is_admin,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def create_occupation(db: AsyncSession, user: User, name: Optional[str] = None) -> None:
    # Assuming occupations are set via service
    pass  # Implement if needed


async def create_clique(
    db: AsyncSession,
    owner: User,
    name: Optional[str] = None,
    description: Optional[str] = None,
    is_private: bool = False,
) -> Clique:
    clique = Clique(
        name=name or fake.company(),
        description=description or fake.text(),
        owner_id=owner.id,
        is_private=is_private,
    )
    db.add(clique)
    await db.flush()
    await db.refresh(clique)
    return clique


async def create_clique_member(
    db: AsyncSession,
    clique: Clique,
    user: User,
    role: str = "member",
    status: str = "joined",
) -> CliqueMember:
    member = CliqueMember(
        clique_id=clique.id,
        user_id=user.id,
        role=role,
        status=status,
    )
    db.add(member)
    await db.flush()
    await db.refresh(member)
    return member


async def create_post(
    db: AsyncSession,
    author: User,
    clique: Clique,
    content: Optional[str] = None,
    status: str = "posted",
) -> Post:
    post = Post(
        content=content or fake.text(),
        author_id=author.id,
        clique_id=clique.id,
        status=status,
    )
    db.add(post)
    await db.flush()
    await db.refresh(post)
    return post


async def create_comment(
    db: AsyncSession,
    author: User,
    post: Post,
    content: Optional[str] = None,
    parent_id: Optional[int] = None,
) -> Comment:
    comment = Comment(
        content=content or fake.text(),
        author_id=author.id,
        post_id=post.id,
        parent_id=parent_id,
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return comment


async def create_media(
    db: AsyncSession,
    user: User,
    filename: Optional[str] = None,
    mime_type: str = "image/jpeg",
    size: int = 1024,
) -> Media:
    media = Media(
        filename=filename or fake.file_name(extension="jpg"),
        mime_type=mime_type,
        size=size,
        user_id=user.id,
    )
    db.add(media)
    await db.flush()
    await db.refresh(media)
    return media


async def create_service(
    db: AsyncSession,
    clique: Clique,
    name: Optional[str] = None,
    description: Optional[str] = None,
    duration_minutes: int = 60,
    price: float = 100.0,
) -> Service:
    service = Service(
        name=name or fake.word(),
        description=description or fake.text(),
        duration_minutes=duration_minutes,
        price=price,
        clique_id=clique.id,
    )
    db.add(service)
    await db.flush()
    await db.refresh(service)
    return service


async def create_availability(
    db: AsyncSession,
    clique: Clique,
    start_time: str,
    end_time: str,
    is_recurring: bool = False,
    recurrence_rule: Optional[str] = None,
) -> Availability:
    availability = Availability(
        clique_id=clique.id,
        start_time=start_time,
        end_time=end_time,
        is_recurring=is_recurring,
        recurrence_rule=recurrence_rule,
    )
    db.add(availability)
    await db.flush()
    await db.refresh(availability)
    return availability


async def create_booking(
    db: AsyncSession,
    booker: User,
    service: Service,
    start_time: str,
    status: str = "pending",
) -> Booking:
    booking = Booking(
        booker_id=booker.id,
        service_id=service.id,
        start_time=start_time,
        status=status,
    )
    db.add(booking)
    await db.flush()
    await db.refresh(booking)
    return booking


async def create_review(
    db: AsyncSession,
    booking: Booking,
    reviewer: User,
    rating: int = 5,
    comment: Optional[str] = None,
) -> Review:
    review = Review(
        booking_id=booking.id,
        reviewer_id=reviewer.id,
        rating=rating,
        comment=comment or fake.text(),
    )
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review


async def create_notification(
    db: AsyncSession,
    user: User,
    type_: str,
    message: Optional[str] = None,
) -> Notification:
    notification = Notification(
        user_id=user.id,
        type=type_,
        message=message or fake.text(),
    )
    db.add(notification)
    await db.flush()
    await db.refresh(notification)
    return notification


async def create_chat(
    db: AsyncSession,
    participants: list[User],
) -> Chat:
    chat = Chat()
    db.add(chat)
    await db.flush()
    await db.refresh(chat)
    # Add participants if needed
    return chat


async def create_message(
    db: AsyncSession,
    chat: Chat,
    sender: User,
    body: Optional[str] = None,
) -> None:
    # Assuming Message model exists
    pass  # Implement if needed


async def create_post_like(
    db: AsyncSession,
    user: User,
    post: Post,
) -> PostLike:
    like = PostLike(
        user_id=user.id,
        post_id=post.id,
    )
    db.add(like)
    await db.flush()
    await db.refresh(like)
    return like