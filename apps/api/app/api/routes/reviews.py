from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...core.errors import Forbidden, NotFound, Validation
from ...models.booking import Booking
from ...models.enums import BookingStatus
from ...models.user import User
from ...schemas.review import Review as ReviewSchema
from ...schemas.review import ReviewCreate
from ...services.reviews import create_review, get_average_rating, get_clique_reviews

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("/bookings/{booking_id}", response_model=dict, status_code=201)
async def create(
    booking_id: UUID,
    data: ReviewCreate,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise NotFound("Booking not found")
    if booking.user_id != current_user.id:
        raise Forbidden(message="Only the booker can review this service")
    if booking.status != BookingStatus.COMPLETED:
        raise Validation("Reviews are only allowed for completed bookings")

    review = await create_review(
        db,
        str(booking_id),
        str(current_user.id),
        data.rating,
        data.comment,
    )
    return {"id": review.id}


@router.get("/cliques/{clique_id}", response_model=dict)
async def list_clique_reviews(
    clique_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    cursor: str | None = Query(None),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
):
    reviews = await get_clique_reviews(db, str(clique_id), cursor, limit)
    average = await get_average_rating(db, str(clique_id))
    items = [ReviewSchema.model_validate(review) for review in reviews]
    return {
        "items": items,
        "nextCursor": None,
        "meta": {"average_rating": average},
    }
