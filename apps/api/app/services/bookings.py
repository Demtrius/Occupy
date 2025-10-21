from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.pagination import apply_datetime_cursor, slice_results
from ..models.booking import Booking
from ..models.clique import Clique
from ..models.enums import BookingStatus, CancelledBy
from ..models.service import Service


async def create_booking(
    db: AsyncSession,
    user_id: str,
    service_id: str,
    start_ts: datetime,
    note: str | None,
    idempotency_key: str | None,
) -> Booking:
    # Get service to calculate end_ts
    service = await db.get(Service, service_id)
    if not service:
        raise ValueError("Service not found")

    if start_ts.tzinfo is None:
        raise ValueError("start_ts must be timezone-aware")
    start_dt = start_ts
    end_dt = start_dt + timedelta(minutes=service.duration_minutes)

    if idempotency_key:
        existing = await db.scalar(
            select(Booking).where(
                Booking.user_id == user_id,
                Booking.idempotency_key == idempotency_key,
            )
        )
        if existing:
            return existing

    # Check availability (simplified, check if any booking overlaps)
    overlap_stmt = select(Booking).where(
        Booking.service_id == service_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        Booking.start_ts < end_dt,
        Booking.end_ts > start_dt,
    )
    overlap = await db.scalar(overlap_stmt)
    if overlap:
        raise ValueError("Time slot not available")

    booking = Booking(
        user_id=user_id,
        service_id=service_id,
        clique_id=service.clique_id,
        start_ts=start_dt,
        end_ts=end_dt,
        note=note,
        status=BookingStatus.PENDING,
        idempotency_key=idempotency_key,
    )
    db.add(booking)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise ValueError("Could not create booking") from exc
    else:
        await db.refresh(booking)
        return booking


async def get_user_bookings(
    db: AsyncSession, user_id: str, status: str | None, cursor: str | None, limit: int
) -> tuple[list[Booking], str | None]:
    stmt = select(Booking).where(Booking.user_id == user_id)
    if status:
        try:
            status_enum = BookingStatus(status)
        except ValueError as exc:
            raise ValueError("Invalid booking status") from exc
        stmt = stmt.where(Booking.status == status_enum)
    stmt = apply_datetime_cursor(stmt, Booking, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return slice_results(rows, limit)


async def get_clique_bookings(
    db: AsyncSession, clique_id: str, status: str | None, cursor: str | None, limit: int
) -> tuple[list[Booking], str | None]:
    stmt = select(Booking).where(Booking.clique_id == clique_id)
    if status:
        try:
            status_enum = BookingStatus(status)
        except ValueError as exc:
            raise ValueError("Invalid booking status") from exc
        stmt = stmt.where(Booking.status == status_enum)
    stmt = apply_datetime_cursor(stmt, Booking, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return slice_results(rows, limit)


async def confirm_booking(
    db: AsyncSession, booking_id: str, actor_user_id: str
) -> Booking | None:
    booking = await db.get(Booking, booking_id)
    if not booking:
        return None

    clique = await db.get(Clique, booking.clique_id)
    if not clique:
        raise ValueError("Booking is in an inconsistent state")

    if str(clique.owner_user_id) != actor_user_id:
        raise ValueError("Not authorized to confirm this booking")

    if booking.status == BookingStatus.CANCELLED:
        raise ValueError("Cannot confirm a cancelled booking")

    booking.status = BookingStatus.CONFIRMED
    await db.commit()
    await db.refresh(booking)
    return booking


async def cancel_booking(
    db: AsyncSession,
    booking_id: str,
    actor_user_id: str,
    reason: str | None,
) -> Booking | None:
    booking = await db.get(Booking, booking_id)
    if not booking:
        return None

    if booking.status == BookingStatus.CANCELLED:
        return booking

    clique = await db.get(Clique, booking.clique_id)
    if not clique:
        raise ValueError("Booking is in an inconsistent state")

    # Determine who is cancelling
    if str(booking.user_id) == actor_user_id:
        actor = CancelledBy.CLIENT
        cutoff = booking.start_ts - timedelta(hours=clique.cancellation_cutoff_hours)
        now = datetime.now(timezone.utc)
        if now > cutoff:
            raise ValueError("Cancellation cutoff has passed")
    elif str(clique.owner_user_id) == actor_user_id:
        actor = CancelledBy.OWNER
        if not reason:
            raise ValueError("Owner cancellation requires a reason")
    else:
        raise ValueError("Not authorized to cancel this booking")

    booking.status = BookingStatus.CANCELLED
    booking.cancelled_by = actor
    booking.cancellation_reason = reason
    await db.commit()
    await db.refresh(booking)
    return booking
