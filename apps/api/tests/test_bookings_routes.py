from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest

from app.models.enums import BookingStatus
from tests.factories import create_clique, create_service, create_user
from tests.utils import assert_cursor_page, assert_error, auth_headers


@pytest.mark.asyncio
async def test_bookings_route_flow(client, db_session, make_token, frozen_time):
    frozen_time.move_to("2024-01-01T09:00:00Z")
    owner = await create_user(db_session, is_business_page=True)
    customer = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, cancellation_cutoff_hours=1)
    service = await create_service(db_session, clique=clique)
    await db_session.commit()

    start_time = (datetime.now(timezone.utc) + timedelta(hours=2)).replace(
        microsecond=0
    )
    booking_payload = {
        "service_id": str(service.id),
        "start_ts": start_time.isoformat(),
        "note": "Initial consultation",
        "idempotency_key": "abc123",
    }

    create_resp = await client.post(
        "/api/v1/bookings",
        json=booking_payload,
        headers=auth_headers(make_token(customer)),
    )
    assert create_resp.status_code == 201
    booking_id = create_resp.json()["id"]

    conflict_payload = dict(booking_payload)
    conflict_payload["idempotency_key"] = "conflict-key"
    conflict = await client.post(
        "/api/v1/bookings",
        json=conflict_payload,
        headers=auth_headers(make_token(customer)),
    )
    assert conflict.status_code == 409
    assert_error(conflict, "conflict")

    list_me = await client.get(
        "/api/v1/bookings/me",
        headers=auth_headers(make_token(customer)),
    )
    assert list_me.status_code == 200
    page = list_me.json()
    assert_cursor_page(page)

    bad_filter = await client.get(
        "/api/v1/bookings/me",
        params={"status": "unknown"},
        headers=auth_headers(make_token(customer)),
    )
    assert bad_filter.status_code == 400
    assert_error(bad_filter, "validation_error")

    confirm_resp = await client.post(
        f"/api/v1/bookings/{booking_id}/confirm",
        headers=auth_headers(make_token(owner)),
    )
    assert confirm_resp.status_code == 200
    assert confirm_resp.json()["status"] == BookingStatus.CONFIRMED.value

    forbidden_confirm = await client.post(
        f"/api/v1/bookings/{booking_id}/confirm",
        headers=auth_headers(make_token(customer)),
    )
    assert forbidden_confirm.status_code == 403
    assert_error(forbidden_confirm, "forbidden")

    owner_cancel = await client.post(
        f"/api/v1/bookings/{booking_id}/cancel",
        headers=auth_headers(make_token(owner)),
    )
    assert owner_cancel.status_code == 400
    assert_error(owner_cancel, "validation_error")

    second_start = (start_time + timedelta(hours=3)).replace(microsecond=0)
    second_payload = {
        "service_id": str(service.id),
        "start_ts": second_start.isoformat(),
        "note": None,
        "idempotency_key": "abc124",
    }
    second = await client.post(
        "/api/v1/bookings",
        json=second_payload,
        headers=auth_headers(make_token(customer)),
    )
    second_id = second.json()["id"]

    cancel_client = await client.post(
        f"/api/v1/bookings/{second_id}/cancel",
        headers=auth_headers(make_token(customer)),
    )
    assert cancel_client.status_code == 200
    assert cancel_client.json()["status"] == BookingStatus.CANCELLED.value

    cancel_again = await client.post(
        f"/api/v1/bookings/{second_id}/cancel",
        headers=auth_headers(make_token(customer)),
    )
    assert cancel_again.status_code == 200

    list_clique_owner = await client.get(
        f"/api/v1/bookings/cliques/{clique.id}",
        headers=auth_headers(make_token(owner)),
    )
    assert list_clique_owner.status_code == 200

    list_clique_customer = await client.get(
        f"/api/v1/bookings/cliques/{clique.id}",
        headers=auth_headers(make_token(customer)),
    )
    assert list_clique_customer.status_code == 200
    customer_page = list_clique_customer.json()
    assert_cursor_page(customer_page)
    # Customer should see only their own bookings (2 items: one confirmed, one cancelled)
    assert len(customer_page["items"]) == 2
    booking_ids = {item["id"] for item in customer_page["items"]}
    assert booking_id in booking_ids
    assert second_id in booking_ids


@pytest.mark.asyncio
async def test_booking_create_service_not_found(client, db_session, make_token):
    user = await create_user(db_session)
    await db_session.commit()

    start_time = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    response = await client.post(
        "/api/v1/bookings",
        json={
            "service_id": str(uuid4()),
            "start_ts": start_time,
            "note": None,
        },
        headers=auth_headers(make_token(user)),
    )
    assert response.status_code == 404
    assert_error(response, "not_found")


@pytest.mark.asyncio
async def test_booking_create_requires_timezone(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    member = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    service = await create_service(db_session, clique=clique)
    await db_session.commit()

    start_time = datetime.now().replace(microsecond=0).isoformat()

    response = await client.post(
        "/api/v1/bookings",
        json={
            "service_id": str(service.id),
            "start_ts": start_time,
            "note": None,
        },
        headers=auth_headers(make_token(member)),
    )
    assert response.status_code == 400
    assert_error(response, "validation_error")


@pytest.mark.asyncio
async def test_booking_confirm_and_cancel_not_found(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    await db_session.commit()

    confirm_resp = await client.post(
        f"/api/v1/bookings/{uuid4()}/confirm",
        headers=auth_headers(make_token(owner)),
    )
    assert confirm_resp.status_code == 404
    assert_error(confirm_resp, "not_found")

    cancel_resp = await client.post(
        f"/api/v1/bookings/{uuid4()}/cancel",
        headers=auth_headers(make_token(owner)),
    )
    assert cancel_resp.status_code == 404
    assert_error(cancel_resp, "not_found")


@pytest.mark.asyncio
async def test_booking_list_clique_not_found(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/bookings/cliques/{uuid4()}",
        headers=auth_headers(make_token(owner)),
    )
    assert response.status_code == 404
    assert_error(response, "not_found")
