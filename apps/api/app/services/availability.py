from __future__ import annotations

from datetime import date, datetime
from typing import List, Tuple
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.availability import Availability
from ..core.pagination import apply_datetime_cursor, slice_results
from ..schemas.availability import Availability as AvailabilitySchema
from ..schemas.availability import AvailabilityCreate, AvailabilityUpdate


def _times_overlap(start_a, end_a, start_b, end_b) -> bool:
    return start_a < end_b and start_b < end_a


def _validate_create_payload(data: AvailabilityCreate) -> None:
    if data.start_time >= data.end_time:
        raise ValueError("start_time must be before end_time")
    if not data.timezone:
        raise ValueError("timezone is required")
    if data.is_recurring:
        if data.day_of_week is None:
            raise ValueError("Recurring availability requires day_of_week")
        if data.date is not None:
            raise ValueError("Recurring availability cannot set a specific date")
    else:
        if data.date is None:
            raise ValueError("date is required for one-time availability")
    if data.valid_from and data.valid_until and data.valid_from > data.valid_until:
        raise ValueError("valid_from cannot be after valid_until")


async def _ensure_no_overlap(
    db: AsyncSession,
    clique_id: UUID,
    start_time,
    end_time,
    *,
    is_recurring: bool,
    day_of_week: int | None,
    date_value: date | None,
    exclude_id: UUID | None = None,
) -> None:
    stmt = select(Availability).where(Availability.clique_id == clique_id)
    if exclude_id is not None:
        stmt = stmt.where(Availability.id != exclude_id)
    if is_recurring:
        stmt = stmt.where(
            Availability.is_recurring.is_(True),
            Availability.day_of_week == day_of_week,
        )
    else:
        stmt = stmt.where(
            Availability.is_recurring.is_(False),
            Availability.date == date_value,
        )
    existing = (await db.execute(stmt)).scalars().all()
    for record in existing:
        if _times_overlap(record.start_time, record.end_time, start_time, end_time):
            raise ValueError("Availability overlaps an existing slot")


async def create_availability(
    db: AsyncSession, clique_id: UUID, availability_data: AvailabilityCreate
) -> AvailabilitySchema:
    _validate_create_payload(availability_data)
    await _ensure_no_overlap(
        db,
        clique_id,
        availability_data.start_time,
        availability_data.end_time,
        is_recurring=availability_data.is_recurring,
        day_of_week=availability_data.day_of_week,
        date_value=availability_data.date,
    )

    availability = Availability(
        clique_id=clique_id,
        **availability_data.model_dump(),
    )
    db.add(availability)
    await db.commit()
    await db.refresh(availability)
    return AvailabilitySchema.model_validate(availability)


async def get_clique_availability(
    db: AsyncSession, clique_id: UUID, cursor: str | None, limit: int
) -> Tuple[List[AvailabilitySchema], str | None]:
    stmt = select(Availability).where(Availability.clique_id == clique_id)
    stmt = apply_datetime_cursor(stmt, Availability, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    items, next_cursor = slice_results(rows, limit)
    availabilities = [AvailabilitySchema.model_validate(a) for a in items]
    return availabilities, next_cursor


async def update_availability(
    db: AsyncSession, availability_id: UUID, update_data: AvailabilityUpdate
) -> AvailabilitySchema | None:
    availability = await db.get(Availability, availability_id)
    if not availability:
        return None

    payload = update_data.model_dump(exclude_unset=True)
    if not payload:
        return AvailabilitySchema.model_validate(availability)

    next_start_time = payload.get("start_time", availability.start_time)
    next_end_time = payload.get("end_time", availability.end_time)
    start_provided = "start_time" in payload
    end_provided = "end_time" in payload

    if start_provided or end_provided:
        base_day = date.today()
        original_duration = datetime.combine(
            base_day, availability.end_time
        ) - datetime.combine(base_day, availability.start_time)
        if start_provided and not end_provided and next_start_time >= next_end_time:
            adjusted_end = (
                datetime.combine(base_day, next_start_time) + original_duration
            )
            if adjusted_end.date() != base_day:
                raise ValueError("Updated availability cannot span multiple days")
            next_end_time = adjusted_end.time()
            payload["end_time"] = next_end_time
        if next_start_time >= next_end_time:
            raise ValueError("start_time must be before end_time")

    next_valid_from = payload.get("valid_from", availability.valid_from)
    next_valid_until = payload.get("valid_until", availability.valid_until)
    if next_valid_from and next_valid_until and next_valid_from > next_valid_until:
        raise ValueError("valid_from cannot be after valid_until")

    next_is_recurring = payload.get("is_recurring", availability.is_recurring)
    next_day_of_week = payload.get("day_of_week", availability.day_of_week)
    next_date = payload.get("date", availability.date)

    if next_is_recurring:
        if next_day_of_week is None:
            raise ValueError("Recurring availability requires day_of_week")
        payload["day_of_week"] = next_day_of_week
        payload["date"] = None
    else:
        if next_date is None:
            raise ValueError("One-time availability requires date")
        payload["date"] = next_date
        payload["day_of_week"] = None

    timezone = payload.get("timezone", availability.timezone)
    if timezone is None:
        raise ValueError("timezone is required")

    for key, value in payload.items():
        setattr(availability, key, value)

    await _ensure_no_overlap(
        db,
        availability.clique_id,
        next_start_time,
        next_end_time,
        is_recurring=availability.is_recurring,
        day_of_week=availability.day_of_week,
        date_value=availability.date,
        exclude_id=availability.id,
    )

    await db.commit()
    await db.refresh(availability)
    return AvailabilitySchema.model_validate(availability)


async def delete_availability(db: AsyncSession, availability_id: UUID) -> bool:
    availability = await db.get(Availability, availability_id)
    if not availability:
        return False
    await db.delete(availability)
    await db.commit()
    return True
