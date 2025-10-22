from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...api.openapi_helpers import (
    combine_openapi_extra,
    error_responses,
    pagination_parameters,
    secured,
)
from ...core.errors import Forbidden, NotFound, Validation
from ...models.booking import Booking
from ...models.enums import BookingStatus
from ...models.user import User
from ...schemas import CursorPageReviews
from ...schemas.review import Review as ReviewSchema
from ...schemas.review import ReviewCreate
from ...services.reviews import create_review, get_average_rating, get_clique_reviews

router = APIRouter(prefix="/api/v1/reviews", tags=["Reviews"])


@router.post(
    "/bookings/{bookingId}",
    summary="Review completed booking",
    description="Customers leave a rating and optional comment for a completed booking.",
    response_model=dict[str, UUID],
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "Review created",
            "content": {
                "application/json": {
                    "example": {"id": "9dd1b664-9e45-4e1c-8343-cfb819a6f5ce"}
                }
            },
        },
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def create(
    bookingId: Annotated[UUID, Path(alias="bookingId")],
    data: ReviewCreate = Body(
        ...,
        examples={
            "five_star": {
                "summary": "Five-star review",
                "value": {
                    "rating": 5,
                    "comment": "Incredible service and attention to detail.",
                },
            }
        },
    ),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    booking = await db.get(Booking, bookingId)
    if not booking:
        raise NotFound("Booking not found")
    if booking.user_id != current_user.id:
        raise Forbidden(message="Only the booker can review this service")
    if booking.status != BookingStatus.COMPLETED:
        raise Validation("Reviews are only allowed for completed bookings")

    review = await create_review(
        db,
        str(bookingId),
        str(current_user.id),
        data.rating,
        data.comment,
    )
    return {"id": review.id}


@router.get(
    "/cliques/{cliqueId}",
    summary="List clique reviews",
    description="Paginated reviews left for services hosted by the clique.",
    response_model=CursorPageReviews,
    responses={
        200: {"description": "Reviews page"},
        **error_responses(401, 403, 404),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def list_clique_reviews(
    cliqueId: Annotated[UUID, Path(alias="cliqueId")],
    current_user: User = Depends(require_active_user),
    cursor: str | None = Query(
        None, include_in_schema=False, description="Opaque pagination cursor"
    ),
    limit: int = Query(
        20,
        ge=1,
        le=50,
        include_in_schema=False,
        description="Page size (default 20, max 50)",
    ),
    db: AsyncSession = Depends(get_db),
):
    reviews = await get_clique_reviews(db, str(cliqueId), cursor, limit)
    average = await get_average_rating(db, str(cliqueId))
    items = [ReviewSchema.model_validate(review) for review in reviews]
    return CursorPageReviews(
        items=items, next_cursor=None, meta={"average_rating": average}
    )
