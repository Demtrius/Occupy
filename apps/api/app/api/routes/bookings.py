from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Path, status
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...api.openapi_helpers import (
    combine_openapi_extra,
    error_responses,
    pagination_parameters,
    secured,
)
from ...core.errors import Conflict, Forbidden, NotFound, Validation
from ...models.user import User
from ...schemas import (
    Booking as BookingSchema,
)
from ...schemas import (
    BookingCreate,
    BookingReschedule,
    CursorPageBookings,
)
from ...schemas.base import BaseSchema
from ...services.bookings import (
    cancel_booking,
    confirm_booking,
    create_booking,
    get_clique_bookings,
    get_user_bookings,
    hydrate_bookings,
    reschedule_booking,
)
from ...services.cliques import get_clique_by_id

router = APIRouter(prefix="/api/v1/bookings", tags=["Bookings"])


class BookingListParams(BaseSchema):
    status: str | None = Field(
        default=None,
        description="Filter by booking status (pending, confirmed, completed)",
    )
    cursor: str | None = Field(
        default=None, description="Opaque pagination cursor from `nextCursor`."
    )
    limit: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Page size (default 20, max 100)",
    )


class BookingCancelParams(BaseSchema):
    reason: str | None = Field(
        default=None,
        description="Reason for cancellation when performed by the clique owner",
    )


def _map_booking_error(exc: ValueError) -> Exception:
    message = str(exc)
    if message == "Service not found":
        return NotFound()
    if message == "Booking is in an inconsistent state":
        return Conflict()
    if message in {
        "Not authorized to confirm this booking",
        "Not authorized to cancel this booking",
        "Not authorized to reschedule this booking",
    }:
        return Forbidden()
    if message in {
        "start_ts must be timezone-aware",
        "Cancellation cutoff has passed",
        "Owner cancellation requires a reason",
        "Cannot reschedule a cancelled booking",
    }:
        return Validation(message)
    if message in {
        "Time slot not available",
        "Could not create booking",
        "Cannot confirm a cancelled booking",
        "Idempotency key reused with different payload",
    }:
        return Conflict()
    return Validation(message)


@router.post(
    "",
    operation_id="BookingsCreate",
    summary="Create booking",
    description="Book a service for a specific start time. Idempotent per `idempotency_key`.",
    response_model=BookingSchema,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "Booking created",
            "content": {
                "application/json": {
                    "example": {
                        "id": "a6a6eacd-3dc0-4a22-91f5-51b1c71a5d55",
                        "serviceId": "51f3dcc5-0f02-4dfe-944c-7c76cf5302b9",
                        "cliqueId": "257c6140-3ab2-4e74-bac6-41b4ed9f8f2e",
                        "userId": "93d52d58-eac4-4e74-a69d-6410a1de0970",
                        "startTs": "2024-04-02T14:00:00Z",
                        "endTs": "2024-04-02T15:00:00Z",
                        "status": "pending",
                        "cancelledBy": None,
                        "cancellationReason": None,
                        "note": "Please prepare the studio for a product shoot.",
                        "idempotencyKey": "booking-20240402",
                        "createdAt": "2024-04-01T10:00:00Z",
                        "updatedAt": "2024-04-01T10:00:00Z",
                    }
                }
            },
        },
        **error_responses(400, 401, 403, 404, 409, 422),
    },
    openapi_extra=secured(),
)
async def create(
    data: BookingCreate = Body(
        ...,
        examples={
            "standard": {
                "summary": "Book a service",
                "value": {
                    "serviceId": "51f3dcc5-0f02-4dfe-944c-7c76cf5302b9",
                    "startTs": "2024-04-02T14:00:00Z",
                    "note": "Please prepare the studio for a product shoot.",
                    "idempotencyKey": "booking-20240402",
                },
            }
        },
    ),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        booking = await create_booking(
            db,
            str(current_user.id),
            str(data.service_id),
            data.start_ts,
            data.note,
            data.idempotency_key,
        )
    except ValueError as exc:
        raise _map_booking_error(exc)
    [hydrated] = await hydrate_bookings(db, [booking])
    return hydrated


@router.patch(
    "/{bookingId}/reschedule",
    operation_id="BookingsReschedule",
    summary="Reschedule booking",
    description="Move a pending booking to a new start time.",
    response_model=BookingSchema,
    responses={
        200: {
            "description": "Booking rescheduled",
            "content": {
                "application/json": {
                    "example": {
                        "id": "a6a6eacd-3dc0-4a22-91f5-51b1c71a5d55",
                        "startTs": "2024-04-03T16:00:00Z",
                        "endTs": "2024-04-03T17:00:00Z",
                        "status": "pending",
                    }
                }
            },
        },
        **error_responses(400, 401, 403, 404, 409, 422),
    },
    openapi_extra=secured(),
)
async def reschedule_booking_route(
    booking_id: Annotated[UUID, Path(alias="bookingId")],
    payload: BookingReschedule = Body(
        ...,
        examples={
            "new_time": {
                "summary": "Reschedule to a later slot",
                "value": {"startTs": "2024-04-03T16:00:00Z"},
            }
        },
    ),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        booking = await reschedule_booking(
            db,
            str(booking_id),
            str(current_user.id),
            payload.start_ts,
        )
    except ValueError as exc:
        raise _map_booking_error(exc)
    if booking is None:
        raise NotFound()
    [hydrated] = await hydrate_bookings(db, [booking])
    return hydrated


@router.get(
    "/me",
    operation_id="BookingsMe",
    summary="List my bookings",
    description="Paginated bookings made by the authenticated user.",
    response_model=CursorPageBookings,
    responses={
        200: {"description": "Bookings page"},
        **error_responses(400, 401, 422),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def list_my_bookings(
    params: BookingListParams = Depends(),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    status_filter = params.status
    cursor = params.cursor
    limit = min(max(params.limit, 1), 100)
    try:
        bookings, next_cursor = await get_user_bookings(
            db, str(current_user.id), status_filter, cursor, limit
        )
    except ValueError as exc:
        raise _map_booking_error(exc)
    items = await hydrate_bookings(db, bookings)
    return CursorPageBookings(items=items, next_cursor=next_cursor)


@router.get(
    "/cliques/{cliqueId}",
    operation_id="BookingsCliques",
    summary="List clique bookings",
    description="Paginated bookings for a clique. Only the owner can access.",
    response_model=CursorPageBookings,
    responses={
        200: {"description": "Bookings page"},
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=combine_openapi_extra(secured(), pagination_parameters()),
)
async def list_clique_bookings(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    params: BookingListParams = Depends(),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    clique = await get_clique_by_id(db, str(clique_id))
    if not clique:
        raise NotFound()
    if clique.owner_user_id != current_user.id:
        raise Forbidden()

    status_filter = params.status
    cursor = params.cursor
    limit = min(max(params.limit, 1), 100)
    try:
        bookings, next_cursor = await get_clique_bookings(
            db, str(clique_id), status_filter, cursor, limit
        )
    except ValueError as exc:
        raise _map_booking_error(exc)
    items = await hydrate_bookings(db, bookings)
    return CursorPageBookings(items=items, next_cursor=next_cursor)


@router.post(
    "/{bookingId}/confirm",
    operation_id="BookingsConfirm",
    summary="Confirm booking",
    description="Clique owner confirms a pending booking.",
    response_model=BookingSchema,
    responses={
        200: {"description": "Booking confirmed"},
        **error_responses(400, 401, 403, 404, 409),
    },
    openapi_extra=secured(),
)
async def confirm(
    booking_id: Annotated[UUID, Path(alias="bookingId")],
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        booking = await confirm_booking(db, str(booking_id), str(current_user.id))
    except ValueError as exc:
        raise _map_booking_error(exc)
    if booking is None:
        raise NotFound()
    [hydrated] = await hydrate_bookings(db, [booking])
    return hydrated


@router.post(
    "/{bookingId}/cancel",
    operation_id="BookingsCancel",
    summary="Cancel booking",
    description="Cancel a booking as the owner or the customer. Optional reason required for owners.",
    response_model=BookingSchema,
    responses={
        200: {
            "description": "Booking cancelled",
            "content": {
                "application/json": {
                    "example": {
                        "id": "a6a6eacd-3dc0-4a22-91f5-51b1c71a5d55",
                        "status": "cancelled",
                        "cancellationReason": "Client unavailable",
                    }
                }
            },
        },
        **error_responses(400, 401, 403, 404, 409, 422),
    },
    openapi_extra=secured(),
)
async def cancel(
    booking_id: Annotated[UUID, Path(alias="bookingId")],
    params: BookingCancelParams = Depends(),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        booking = await cancel_booking(
            db, str(booking_id), str(current_user.id), params.reason
        )
    except ValueError as exc:
        raise _map_booking_error(exc)
    if booking is None:
        raise NotFound()
    [hydrated] = await hydrate_bookings(db, [booking])
    return hydrated
