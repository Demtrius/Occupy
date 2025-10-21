from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest

from app.models.booking import Booking
from tests.factories import create_clique, create_service, create_user
from tests.utils import assert_cursor_page, assert_error, auth_headers


@pytest.mark.asyncio
async def test_booking_lifecycle(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    clique.cancellation_cutoff_hours = 1
    service = await create_service(db_session, clique=clique)
    client_user = await create_user(db_session)
    await db_session.commit()

    start_ts = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(hours=2)

    payload = {
        "service_id": str(service.id),
        "start_ts": start_ts.isoformat(),
        "note": "Initial consultation",
        "idempotency_key": str(uuid4()),
    }

    create_response = await client.post(
        "/api/v1/bookings",
        json=payload,
        headers=auth_headers(make_token(client_user)),
    )
    assert create_response.status_code == 201
    booking_data = create_response.json()
    booking_id = booking_data["id"]

    # Owner can confirm the booking
    confirm_response = await client.post(
        f"/api/v1/bookings/{booking_id}/confirm",
        headers=auth_headers(make_token(owner)),
    )
    assert confirm_response.status_code == 200
    assert confirm_response.json()["status"] == "confirmed"

    # Client can list their bookings with cursor metadata
    list_response = await client.get(
        "/api/v1/bookings/me",
        headers=auth_headers(make_token(client_user)),
    )
    assert list_response.status_code == 200
    bookings_payload = list_response.json()
    assert_cursor_page(bookings_payload)
    assert bookings_payload["items"][0]["id"] == booking_id

    # Client cancels within cutoff
    cancel_response = await client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers=auth_headers(make_token(client_user)),
    )
    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_booking_idempotency(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    service = await create_service(db_session, clique=clique)
    customer = await create_user(db_session)
    await db_session.commit()

    start_ts = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(hours=1)
    idempotency_key = str(uuid4())
    payload = {
        "service_id": str(service.id),
        "start_ts": start_ts.isoformat(),
        "note": "Haircut",
        "idempotency_key": idempotency_key,
    }

    headers = auth_headers(make_token(customer))
    first = await client.post("/api/v1/bookings", json=payload, headers=headers)
    assert first.status_code == 201
    booking_id = first.json()["id"]

    second = await client.post("/api/v1/bookings", json=payload, headers=headers)
    assert second.status_code == 201
    assert second.json()["id"] == booking_id


@pytest.mark.asyncio
async def test_booking_conflict_when_slot_taken(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    service = await create_service(db_session, clique=clique)
    customer_one = await create_user(db_session)
    customer_two = await create_user(db_session)
    await db_session.commit()

    start_ts = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(hours=3)
    payload = {
        "service_id": str(service.id),
        "start_ts": start_ts.isoformat(),
    }

    first = await client.post(
        "/api/v1/bookings",
        json=payload,
        headers=auth_headers(make_token(customer_one)),
    )
    assert first.status_code == 201

    second = await client.post(
        "/api/v1/bookings",
        json=payload,
        headers=auth_headers(make_token(customer_two)),
    )
    assert second.status_code == 409
    assert_error(second, "conflict")
