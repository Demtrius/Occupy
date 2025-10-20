from datetime import date, datetime, time, timedelta
from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.availability import Availability
from ..models.booking import Booking
from ..models.service import Service
from ..schemas.availability import Slot


async def get_available_slots(
    db: AsyncSession, clique_id: UUID, target_date: date
) -> List[Slot]:
    """Compute available time slots for a clique on a given date."""
    # Get all availability for the clique
    avail_stmt = select(Availability).where(Availability.clique_id == clique_id)
    avail_result = await db.execute(avail_stmt)
    availabilities = avail_result.scalars().all()

    # Get all services for the clique
    service_stmt = select(Service).where(Service.clique_id == clique_id, Service.is_active == True)
    service_result = await db.execute(service_stmt)
    services = service_result.scalars().all()

    # Get existing bookings for the date
    booking_stmt = select(Booking).where(
        Booking.clique_id == clique_id,
        Booking.start_time >= datetime.combine(target_date, time.min),
        Booking.start_time < datetime.combine(target_date + timedelta(days=1), time.min),
        Booking.status.in_(["pending", "confirmed"])
    )
    booking_result = await db.execute(booking_stmt)
    bookings = booking_result.scalars().all()

    available_slots = []

    for availability in availabilities:
        if availability.is_recurring:
            if availability.day_of_week != target_date.weekday():
                continue
        else:
            if availability.date != target_date:
                continue

        # Generate slots based on services and availability
        current_time = availability.start_time
        while current_time < availability.end_time:
            for service in services:
                end_time = (datetime.combine(target_date, current_time) + timedelta(minutes=service.duration_minutes)).time()
                if end_time <= availability.end_time:
                    # Check if slot conflicts with existing bookings
                    conflict = False
                    for booking in bookings:
                        if (booking.start_time.time() < end_time and
                            (booking.start_time + timedelta(minutes=booking.service.duration_minutes)).time() > current_time):
                            conflict = True
                            break
                    if not conflict:
                        available_slots.append(Slot(
                            start_time=current_time,
                            end_time=end_time,
                            service_id=service.id,
                            service_title=service.title,
                        ))
            # Move to next potential slot (assuming 30 min increments, but this is simplistic)
            current_time = (datetime.combine(target_date, current_time) + timedelta(minutes=30)).time()

    return available_slots