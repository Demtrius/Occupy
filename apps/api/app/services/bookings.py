from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.booking import Booking
from ..models.enums import BookingStatus
from ..models.service import Service


async def create_booking(
    db: AsyncSession,
    user_id: str,
    service_id: str,
    start_ts: str,
    note: str | None,
    idempotency_key: str | None,
) -> Booking:
    # Get service to calculate end_ts
    service = await db.get(Service, service_id)
    if not service:
        raise ValueError("Service not found")

    start_dt = datetime.fromisoformat(start_ts)
    end_dt = start_dt + timedelta(minutes=service.duration_minutes)

    # Check availability (simplified, check if any booking overlaps)
    overlap_stmt = select(Booking).where(
        Booking.service_id == service_id,
        Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        Booking.start_ts < end_dt.isoformat(),
        (Booking.start_ts + timedelta(minutes=service.duration_minutes)) > start_dt
    )
    overlap = await db.scalar(overlap_stmt)
    if overlap:
        raise ValueError("Time slot not available")

    booking = Booking(
        user_id=user_id,
        service_id=service_id,
        start_ts=start_ts,
        end_ts=end_dt.isoformat(),
        note=note,
        status=BookingStatus.PENDING,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


async def get_user_bookings(db: AsyncSession, user_id: str, status: str | None, cursor: str | None, limit: int):
    stmt = select(Booking).where(Booking.user_id == user_id)
    if status:
        stmt = stmt.where(Booking.status == status)
    if cursor:
        stmt = stmt.where(Booking.id > cursor)
    stmt = stmt.order_by(Booking.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_clique_bookings(db: AsyncSession, clique_id: str, status: str | None, cursor: str | None, limit: int):
    stmt = select(Booking).where(Booking.clique_id == clique_id)
    if status:
        stmt = stmt.where(Booking.status == status)
    if cursor:
        stmt = stmt.where(Booking.id > cursor)
    stmt = stmt.order_by(Booking.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def confirm_booking(db: AsyncSession, booking_id: str) -> None:
    booking = await db.get(Booking, booking_id)
    if booking:
        booking.status = BookingStatus.CONFIRMED
        await db.commit()


async def cancel_booking(db: AsyncSession, booking_id: str, cancelled_by: str, reason: str | None) -> None:
    booking = await db.get(Booking, booking_id)
    if booking:
        booking.status = BookingStatus.CANCELLED
        booking.cancelled_by = cancelled_by
        booking.cancellation_reason = reason
        await db.commit()