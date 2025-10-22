from __future__ import annotations

import pytest

from app.models.enums import BookingStatus
from app.models.review import Review
from app.services.reviews import get_clique_reviews
from tests.factories import (
    create_booking,
    create_clique,
    create_service,
    create_user,
)
from tests.utils import assert_error, auth_headers


@pytest.mark.asyncio
async def test_create_review_requires_completed_booking(client, db_session, make_token):
    business = await create_user(db_session, is_business_page=True)
    booker = await create_user(db_session)
    clique = await create_clique(db_session, owner=business)
    service = await create_service(db_session, clique=clique)
    booking = await create_booking(
        db_session, service=service, user=booker, status=BookingStatus.COMPLETED
    )
    await db_session.commit()

    payload = {"rating": 5, "comment": "Great!"}
    response = await client.post(
        f"/api/v1/reviews/bookings/{booking.id}",
        json=payload,
        headers=auth_headers(make_token(booker)),
    )
    assert response.status_code == 201
    body = response.json()
    assert "id" in body


@pytest.mark.asyncio
async def test_create_review_rejects_incomplete_booking(client, db_session, make_token):
    business = await create_user(db_session, is_business_page=True)
    booker = await create_user(db_session)
    clique = await create_clique(db_session, owner=business)
    service = await create_service(db_session, clique=clique)
    booking = await create_booking(db_session, service=service, user=booker)
    await db_session.commit()

    payload = {"rating": 4}
    response = await client.post(
        f"/api/v1/reviews/bookings/{booking.id}",
        json=payload,
        headers=auth_headers(make_token(booker)),
    )
    assert response.status_code == 400
    assert_error(response, "validation_error")


@pytest.mark.asyncio
async def test_create_review_requires_booking_owner(client, db_session, make_token):
    business = await create_user(db_session, is_business_page=True)
    booker = await create_user(db_session)
    outsider = await create_user(db_session)
    clique = await create_clique(db_session, owner=business)
    service = await create_service(db_session, clique=clique)
    booking = await create_booking(
        db_session, service=service, user=booker, status=BookingStatus.COMPLETED
    )
    await db_session.commit()

    response = await client.post(
        f"/api/v1/reviews/bookings/{booking.id}",
        json={"rating": 5},
        headers=auth_headers(make_token(outsider)),
    )
    assert response.status_code == 403
    assert_error(response, "forbidden")


@pytest.mark.asyncio
async def test_list_reviews_returns_average(client, db_session, make_token):
    business = await create_user(db_session, is_business_page=True)
    booker = await create_user(db_session)
    clique = await create_clique(db_session, owner=business)
    service = await create_service(db_session, clique=clique)

    booking_one = await create_booking(
        db_session, service=service, user=booker, status=BookingStatus.COMPLETED
    )
    booking_two = await create_booking(
        db_session,
        service=service,
        user=booker,
        status=BookingStatus.COMPLETED,
    )
    await db_session.commit()

    # Insert reviews directly via ORM to avoid exercising the create endpoint twice.
    db_session.add(
        Review(
            booking_id=booking_one.id,
            rater_user_id=booker.id,
            rating=5,
            comment="Excellent",
        )
    )
    db_session.add(
        Review(
            booking_id=booking_two.id,
            rater_user_id=booker.id,
            rating=3,
            comment="Okay",
        )
    )
    await db_session.commit()

    response = await client.get(
        f"/api/v1/reviews/cliques/{clique.id}",
        headers=auth_headers(make_token(booker)),
    )
    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload and len(payload["items"]) == 2
    returned_ids = {item["booking_id"] for item in payload["items"]}
    assert returned_ids == {str(booking_one.id), str(booking_two.id)}
    assert payload["meta"]["average_rating"] == pytest.approx(4.0)

    reviews = await get_clique_reviews(db_session, str(clique.id), None, 10)
    assert len(reviews) == 2
