from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.errors import Validation
from ..models.booking import Booking
from ..models.review import Review


async def create_review(
    db: AsyncSession,
    booking_id: str,
    rater_user_id: str,
    rating: int,
    comment: str | None,
) -> Review:
    existing = await db.scalar(select(Review).where(Review.booking_id == booking_id))
    if existing:
        raise Validation("Review already exists")

    review = Review(
        booking_id=booking_id,
        rater_user_id=rater_user_id,
        rating=rating,
        comment=comment,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def get_clique_reviews(
    db: AsyncSession, clique_id: str, cursor: str | None, limit: int
):
    stmt = (
        select(Review)
        .join(Booking, Review.booking_id == Booking.id)
        .where(Booking.clique_id == clique_id)
    )
    if cursor:
        stmt = stmt.where(Review.id > cursor)
    stmt = stmt.order_by(Review.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_average_rating(db: AsyncSession, clique_id: str) -> float:
    stmt = (
        select(func.avg(Review.rating))
        .join(Booking, Review.booking_id == Booking.id)
        .where(Booking.clique_id == clique_id)
    )
    result = await db.scalar(stmt)
    if result is None:
        return 0.0
    return float(result)
