from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest

from app.models.enums import BookingStatus
from app.services.bookings import (
    cancel_booking,
    confirm_booking,
    create_booking,
    get_clique_bookings,
    get_user_bookings,
)
from tests.factories import create_clique, create_service, create_user


@pytest.mark.asyncio
async def test_create_booking_idempotency_and_overlap(db_session):
    owner = await create_user(db_session, is_business_page=True)
    client = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    service = await create_service(db_session, clique=clique, duration_minutes=60)
    await db_session.commit()

    start_ts = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(hours=4)
    idem_key = str(uuid4())

    booking = await create_booking(
        db_session,
        str(client.id),
        str(service.id),
        start_ts,
        "test",
        idem_key,
    )

    same_booking = await create_booking(
        db_session,
        str(client.id),
        str(service.id),
        start_ts,
        "test",
        idem_key,
    )
    assert booking.id == same_booking.id

    with pytest.raises(ValueError, match="Time slot not available"):
        await create_booking(
            db_session,
            str(client.id),
            str(service.id),
            start_ts + timedelta(minutes=15),
            None,
            str(uuid4()),
        )


@pytest.mark.asyncio
async def test_confirm_and_cancel_flows(db_session):
    owner = await create_user(db_session, is_business_page=True)
    client = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, cancellation_cutoff_hours=2)
    service = await create_service(db_session, clique=clique, duration_minutes=30)
    await db_session.commit()

    start_ts = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(hours=3)
    booking = await create_booking(
        db_session,
        str(client.id),
        str(service.id),
        start_ts,
        None,
        None,
    )

    confirmed = await confirm_booking(db_session, str(booking.id), str(owner.id))
    assert confirmed is not None and confirmed.status == BookingStatus.CONFIRMED

    cancelled = await cancel_booking(
        db_session, str(booking.id), str(client.id), "change"
    )
    assert cancelled is not None and cancelled.status == BookingStatus.CANCELLED

    repeat_cancel = await cancel_booking(
        db_session, str(booking.id), str(owner.id), "owner duplicate"
    )
    assert repeat_cancel.status == BookingStatus.CANCELLED


@pytest.mark.asyncio
async def test_booking_list_filters(db_session):
    owner = await create_user(db_session, is_business_page=True)
    client = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    service = await create_service(db_session, clique=clique, duration_minutes=15)
    await db_session.commit()

    now = datetime.now(timezone.utc).replace(microsecond=0)
    for offset in range(3):
        await create_booking(
            db_session,
            str(client.id),
            str(service.id),
            now + timedelta(minutes=30 * offset + 60),
            None,
            None,
        )

    bookings, next_cursor = await get_user_bookings(
        db_session, str(client.id), None, None, 10
    )
    assert len(bookings) == 3
    assert next_cursor is None

    clique_bookings, _ = await get_clique_bookings(
        db_session, str(clique.id), None, None, 10
    )
    assert len(clique_bookings) == 3
    assert all(b.clique_id == clique.id for b in clique_bookings)


@pytest.mark.asyncio
async def test_booking_validation_and_errors(db_session):
    owner = await create_user(db_session, is_business_page=True)
    client = await create_user(db_session)
    stranger = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    service = await create_service(db_session, clique=clique, duration_minutes=45)
    await db_session.commit()

    naive_start = datetime.utcnow().replace(microsecond=0)
    with pytest.raises(ValueError, match="timezone-aware"):
        await create_booking(
            db_session,
            str(client.id),
            str(service.id),
            naive_start,
            None,
            None,
        )

    start_ts = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(hours=5)
    booking = await create_booking(
        db_session,
        str(client.id),
        str(service.id),
        start_ts,
        None,
        None,
    )

    with pytest.raises(ValueError, match="Not authorized"):
        await confirm_booking(db_session, str(booking.id), str(stranger.id))

    with pytest.raises(ValueError, match="requires a reason"):
        await cancel_booking(db_session, str(booking.id), str(owner.id), None)
