"""
Test to verify slots computation works correctly.

This test demonstrates that the slots endpoint correctly returns empty slots
when querying a day that doesn't match the availability schedule.
"""

import pytest
from datetime import datetime, timedelta, time, date
from uuid import uuid4
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.availability import Availability
from app.models.service import Service
from app.models.clique import Clique
from app.models.user import User
from app.services.slots import compute_slots
from tests.factories import (
    create_user,
    create_clique,
    create_service,
    create_availability,
)


@pytest.mark.asyncio
@pytest.mark.asyncio
async def test_slots_returns_empty_for_wrong_weekday(db_session: AsyncSession):
    """Test that slots returns empty when querying Friday but availability is Tuesday"""

    user = await create_user(db_session)
    clique = await create_clique(db_session, owner=user)
    service = await create_service(db_session, clique=clique)
    await create_availability(
        db_session,
        clique=clique,
        is_recurring=True,
        day_of_week=1,  # Tuesday
        start_time=time(10, 0),  # 10 AM
        end_time=time(18, 0),  # 6 PM
        timezone_str="UTC",
    )
    await db_session.commit()

    # Query: Friday, November 7, 2025 (should return empty)
    friday_start = datetime(2025, 11, 7, 0, 0, 0, tzinfo=ZoneInfo("UTC"))
    friday_end = datetime(2025, 11, 8, 0, 0, 0, tzinfo=ZoneInfo("UTC"))

    slots = await compute_slots(
        db_session, str(clique.id), str(service.id), friday_start, friday_end
    )

    assert slots == [], f"Expected empty slots for Friday, got: {slots}"

    # Query: Tuesday, November 4, 2025 (should return slots)
    tuesday_start = datetime(2025, 11, 4, 0, 0, 0, tzinfo=ZoneInfo("UTC"))
    tuesday_end = datetime(2025, 11, 5, 0, 0, 0, tzinfo=ZoneInfo("UTC"))

    slots = await compute_slots(
        db_session, str(clique.id), str(service.id), tuesday_start, tuesday_end
    )

    assert len(slots) > 0, f"Expected slots for Tuesday, got: {slots}"

    # Verify the slots are within the expected time range
    for slot in slots:
        # Should be on Tuesday in UTC
        assert slot.start_ts.date() == date(2025, 11, 4)
        assert slot.end_ts.date() == date(2025, 11, 4)

        # Should be within 10:00-18:00 UTC (accounting for 1-hour duration)
        assert slot.start_ts.hour >= 10
        assert slot.end_ts.hour <= 18

        # Should be 1 hour duration
        assert slot.end_ts - slot.start_ts == timedelta(hours=1)


@pytest.mark.asyncio
async def test_slots_timezone_handling(db_session: AsyncSession):
    """Test that timezone handling works correctly"""

    user = await create_user(db_session)
    clique = await create_clique(db_session, owner=user)
    service = await create_service(db_session, clique=clique)
    await create_availability(
        db_session,
        clique=clique,
        is_recurring=True,
        day_of_week=1,  # Tuesday
        start_time=time(10, 0),  # 10 AM Eastern
        end_time=time(18, 0),  # 6 PM Eastern
        timezone_str="America/New_York",
    )
    await db_session.commit()

    # Query Tuesday in UTC
    tuesday_start = datetime(2025, 11, 4, 0, 0, 0, tzinfo=ZoneInfo("UTC"))
    tuesday_end = datetime(2025, 11, 5, 0, 0, 0, tzinfo=ZoneInfo("UTC"))

    slots = await compute_slots(
        db_session, str(clique.id), str(service.id), tuesday_start, tuesday_end
    )

    assert len(slots) > 0, "Should have slots for Tuesday"

    # Verify slots are correctly converted to UTC
    # 10 AM Eastern = 15 PM UTC (November 4, 2025 is after DST ends)
    for slot in slots:
        # Should be on Tuesday in UTC
        assert slot.start_ts.date() == date(2025, 11, 4)

        # Should be between 15:00 and 23:00 UTC (10:00-18:00 Eastern)
        assert slot.start_ts.hour >= 15
        assert slot.end_ts.hour <= 23


@pytest.mark.asyncio
async def test_debug_exact_issue_scenario(db_session: AsyncSession):
    """Debug the exact scenario from the issue"""

    # Setup: Create a user and clique using factories
    user = await create_user(db_session, email="test@example.com", username="testuser")
    clique = await create_clique(db_session, owner=user, name="Test Clique")
    service = await create_service(
        db_session,
        clique=clique,
        title="Test Service",
        duration_minutes=60,
        buffer_minutes=0,
    )

    # Create availability for Tuesday (day_of_week=1) - EXACT scenario from issue
    availability = await create_availability(
        db_session,
        clique=clique,
        is_recurring=True,
        day_of_week=1,  # Tuesday
        start_time=time(10, 0),  # 10:00 UTC
        end_time=time(18, 0),  # 18:00 UTC
        timezone_str="UTC",
    )

    await db_session.commit()

    print(f"\n=== DEBUG INFO ===")
    print(f"Created availability:")
    print(f"  - Recurring: {availability.is_recurring}")
    print(f"  - Day of week: {availability.day_of_week} (0=Monday, 1=Tuesday)")
    print(f"  - Start time: {availability.start_time}")
    print(f"  - End time: {availability.end_time}")
    print(f"  - Timezone: {availability.timezone}")

    # Test the EXACT request from the issue
    # Date: 2025-11-03T23:00:00Z to 2025-11-04T22:59:59Z
    # This covers November 4, 2025 (Tuesday)
    window_start = datetime(2025, 11, 3, 23, 0, 0, tzinfo=ZoneInfo("UTC"))
    window_end = datetime(2025, 11, 4, 22, 59, 59, tzinfo=ZoneInfo("UTC"))

    print(f"\nQuery window:")
    print(f"  - Start: {window_start}")
    print(f"  - End: {window_end}")
    print(f"  - Covers date: {window_start.date()} to {window_end.date()}")

    # Check what day November 4, 2025 falls on
    nov_4 = datetime(2025, 11, 4).date()
    print(f"November 4, 2025 is a weekday: {nov_4.weekday()} (0=Monday, 1=Tuesday)")

    # Debug the date range logic from slots.py
    date_start = window_start.date()
    date_end = window_end.date()
    print(f"\nDate range loop: {date_start} to {date_end}")

    current_day = date_start
    while current_day <= date_end:
        print(f"  Checking day: {current_day}, weekday: {current_day.weekday()}")
        if availability.is_recurring:
            if availability.day_of_week is None:
                print(f"    -> Skipping: day_of_week is None")
            elif current_day.weekday() != availability.day_of_week:
                print(
                    f"    -> Skipping: weekday {current_day.weekday()} != {availability.day_of_week}"
                )
            else:
                print(f"    -> MATCH! This day should generate slots")
        current_day += timedelta(days=1)

    slots = await compute_slots(
        db_session, str(clique.id), str(service.id), window_start, window_end
    )

    print(f"\nResult: {len(slots)} slots found")
    for i, slot in enumerate(slots):
        print(f"  Slot {i+1}: {slot}")

    # This should pass but currently fails
    assert len(slots) > 0, f"Expected slots for Tuesday Nov 4, 2025, got: {slots}"
