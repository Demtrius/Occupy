from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...core.errors import Conflict, Forbidden, NotFound, Validation
from ...models.user import User
from ...schemas import Booking as BookingSchema, BookingCreate, CursorPage
from ...services.bookings import (
    cancel_booking,
    confirm_booking,
    create_booking,
    get_clique_bookings,
    get_user_bookings,
)
from ...services.cliques import get_clique_by_id

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _map_booking_error(exc: ValueError) -> Exception:
    message = str(exc)
    if message == "Service not found":
        return NotFound()
    if message in {
        "Time slot not available",
        "Could not create booking",
        "Cannot confirm a cancelled booking",
        "Idempotency key reused with different payload",
    }:
        return Conflict()
    if message in {
        "start_ts must be timezone-aware",
        "Cancellation cutoff has passed",
        "Owner cancellation requires a reason",
    }:
        return Validation(message)
    if message in {
        "Not authorized to confirm this booking",
        "Not authorized to cancel this booking",
    }:
        return Forbidden()
    if message == "Booking is in an inconsistent state":
        return Conflict()
    return Validation(message)


@router.post("", response_model=BookingSchema, status_code=201)
async def create(
    data: BookingCreate,
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


@router.get("/me", response_model=CursorPage[BookingSchema])
async def list_my_bookings(
    current_user: User = Depends(require_active_user),
    status: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(20),
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
    return CursorPage[BookingSchema](items=items, next_cursor=next_cursor)


@router.get("/cliques/{clique_id}", response_model=CursorPage[BookingSchema])
async def list_clique_bookings(
    clique_id: UUID,
    status: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(20),
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
    return CursorPage[BookingSchema](items=items, next_cursor=next_cursor)


@router.post("/{booking_id}/confirm", response_model=BookingSchema)
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


@router.post("/{booking_id}/cancel", response_model=BookingSchema)
async def cancel(
    booking_id: UUID,
    reason: str | None = Query(None),
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
