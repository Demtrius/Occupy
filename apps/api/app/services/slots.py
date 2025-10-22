from __future__ import annotations

from datetime import datetime, timedelta
from typing import List
from zoneinfo import ZoneInfo
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.availability import Availability
from ..models.booking import Booking
from ..models.enums import BookingStatus
from ..models.service import Service

UTC = ZoneInfo("UTC")


def _get_timezone(name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(name or "UTC")
    except Exception:
        return UTC


def _overlaps(
    start_a: datetime, end_a: datetime, start_b: datetime, end_b: datetime
) -> bool:
    return start_a < end_b and end_a > start_b


async def compute_slots(
    db: AsyncSession,
    clique_id: str,
    service_id: str,
    window_start: datetime,
    window_end: datetime,
) -> List[dict[str, str]]:
    try:
        service_uuid = UUID(service_id)
        clique_uuid = UUID(clique_id)
    except ValueError as exc:
        raise ValueError("Service not found") from exc

    service = await db.get(Service, service_uuid)
    if not service or service.clique_id != clique_uuid:
        raise ValueError("Service not found")

    if window_start.tzinfo is None or window_end.tzinfo is None:
        raise ValueError("Window bounds must be timezone-aware")
    window_start_utc = window_start.astimezone(UTC)
    window_end_utc = window_end.astimezone(UTC)
    if window_start_utc >= window_end_utc:
        raise ValueError("Invalid window")

    duration = timedelta(minutes=service.duration_minutes)
    buffer = timedelta(minutes=service.buffer_minutes or 0)
    if duration <= timedelta(0):
        raise ValueError("Invalid service duration")

    availabilities = (
        (
            await db.execute(
                select(Availability).where(Availability.clique_id == clique_uuid)
            )
        )
        .scalars()
        .all()
    )

    bookings = (
        (
            await db.execute(
                select(Booking).where(
                    Booking.clique_id == clique_uuid,
                    Booking.status.in_(
                        [BookingStatus.PENDING, BookingStatus.CONFIRMED]
                    ),
                    Booking.start_ts < window_end_utc,
                    Booking.end_ts > window_start_utc,
                )
            )
        )
        .scalars()
        .all()
    )

    slots: List[dict[str, str]] = []
    date_start = window_start_utc.date()
    date_end = window_end_utc.date()

    for availability in availabilities:
        tz = _get_timezone(availability.timezone)
        valid_from = availability.valid_from
        valid_until = availability.valid_until

        current_day = date_start
        while current_day <= date_end:
            if availability.is_recurring:
                if (
                    availability.day_of_week is None
                    or current_day.weekday() != availability.day_of_week
                ):
                    current_day += timedelta(days=1)
                    continue
                if valid_from and current_day < valid_from:
                    current_day += timedelta(days=1)
                    continue
                if valid_until and current_day > valid_until:
                    current_day += timedelta(days=1)
                    continue
            else:
                if availability.date != current_day:
                    current_day += timedelta(days=1)
                    continue

            start_local = datetime.combine(
                current_day, availability.start_time, tzinfo=tz
            )
            end_local = datetime.combine(current_day, availability.end_time, tzinfo=tz)
            if end_local <= start_local:
                current_day += timedelta(days=1)
                continue
            start_utc = start_local.astimezone(UTC)
            end_utc = end_local.astimezone(UTC)

            slot_start = max(start_utc, window_start_utc)
            while (
                slot_start + duration <= end_utc
                and slot_start + duration <= window_end_utc
            ):
                slot_end = slot_start + duration
                has_conflict = any(
                    _overlaps(slot_start, slot_end, booking.start_ts, booking.end_ts)
                    for booking in bookings
                )
                if not has_conflict:
                    slots.append(
                        {
                            "start_ts": slot_start.isoformat(),
                            "end_ts": slot_end.isoformat(),
                        }
                    )
                slot_start = slot_end + buffer

            current_day += timedelta(days=1)

    slots.sort(key=lambda item: item["start_ts"])
    return slots
