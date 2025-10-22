from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query, status
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
    BookingCreate,
    BookingReschedule,
    CursorPageBookings,
)
from ...services.bookings import (
    cancel_booking,
    confirm_booking,
    create_booking,
    get_clique_bookings,
    get_user_bookings,
    reschedule_booking,
)
from ...services.cliques import get_clique_by_id

router = APIRouter(prefix="/api/v1/bookings", tags=["Bookings"])


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
                        "service_id": "51f3dcc5-0f02-4dfe-944c-7c76cf5302b9",
                        "clique_id": "257c6140-3ab2-4e74-bac6-41b4ed9f8f2e",
                        "user_id": "93d52d58-eac4-4e74-a69d-6410a1de0970",
                        "start_ts": "2024-04-02T14:00:00Z",
                        "end_ts": "2024-04-02T15:00:00Z",
                        "status": "pending",
                        "cancelled_by": None,
                        "cancellation_reason": None,
                        "note": "Please prepare the studio for a product shoot.",
                        "idempotency_key": "booking-20240402",
                        "created_at": "2024-04-01T10:00:00Z",
                        "updated_at": "2024-04-01T10:00:00Z",
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
                    "service_id": "51f3dcc5-0f02-4dfe-944c-7c76cf5302b9",
                    "start_ts": "2024-04-02T14:00:00Z",
                    "note": "Please prepare the studio for a product shoot.",
                    "idempotency_key": "booking-20240402",
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
    return BookingSchema.model_validate(booking)


@router.patch(
    "/{booking_id}/reschedule",
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
                        "start_ts": "2024-04-03T16:00:00Z",
                        "end_ts": "2024-04-03T17:00:00Z",
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
    booking_id: UUID,
    payload: BookingReschedule = Body(
        ...,
        examples={
            "new_time": {
                "summary": "Reschedule to a later slot",
                "value": {"start_ts": "2024-04-03T16:00:00Z"},
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
    return BookingSchema.model_validate(booking)


@router.get(
    "/me",
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
    current_user: User = Depends(require_active_user),
    status: str | None = Query(
        None, description="Filter by booking status (pending, confirmed, completed)"
    ),
    cursor: str | None = Query(
        None, include_in_schema=False, description="Opaque pagination cursor"
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
        include_in_schema=False,
        description="Page size (default 20, max 100)",
    ),
    db: AsyncSession = Depends(get_db),
):
    limit = min(max(limit, 1), 100)
    try:
        bookings, next_cursor = await get_user_bookings(
            db, str(current_user.id), status, cursor, limit
        )
    except ValueError as exc:
        raise _map_booking_error(exc)
    items = [BookingSchema.model_validate(booking) for booking in bookings]
    return CursorPageBookings(items=items, next_cursor=next_cursor)


@router.get(
    "/cliques/{clique_id}",
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
    clique_id: UUID,
    status: str | None = Query(
        None, description="Filter by booking status (pending, confirmed, completed)"
    ),
    cursor: str | None = Query(
        None, include_in_schema=False, description="Opaque pagination cursor"
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
        include_in_schema=False,
        description="Page size (default 20, max 100)",
    ),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    clique = await get_clique_by_id(db, str(clique_id))
    if not clique:
        raise NotFound()
    if clique.owner_user_id != current_user.id:
        raise Forbidden()

    limit = min(max(limit, 1), 100)
    try:
        bookings, next_cursor = await get_clique_bookings(
            db, str(clique_id), status, cursor, limit
        )
    except ValueError as exc:
        raise _map_booking_error(exc)
    items = [BookingSchema.model_validate(booking) for booking in bookings]
    return CursorPageBookings(items=items, next_cursor=next_cursor)


@router.post(
    "/{booking_id}/confirm",
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
    booking_id: UUID,
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        booking = await confirm_booking(db, str(booking_id), str(current_user.id))
    except ValueError as exc:
        raise _map_booking_error(exc)
    if booking is None:
        raise NotFound()
    return BookingSchema.model_validate(booking)


@router.post(
    "/{booking_id}/cancel",
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
                        "cancellation_reason": "Client unavailable",
                    }
                }
            },
        },
        **error_responses(400, 401, 403, 404, 409, 422),
    },
    openapi_extra=secured(),
)
async def cancel(
    booking_id: UUID,
    reason: str | None = Query(
        None,
        description="Reason for cancellation when performed by the clique owner",
    ),
    current_user: User = Depends(require_active_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        booking = await cancel_booking(
            db, str(booking_id), str(current_user.id), reason
        )
    except ValueError as exc:
        raise _map_booking_error(exc)
    if booking is None:
        raise NotFound()
    return BookingSchema.model_validate(booking)
