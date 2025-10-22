from __future__ import annotations

from datetime import date, time
from uuid import uuid4

import pytest

from app.models.availability import Availability
from app.models.clique import CliqueMember
from app.models.enums import MembershipStatus, Privacy, Role
from app.schemas.availability import AvailabilityCreate, AvailabilityUpdate
from app.services.availability import (
    create_availability,
    delete_availability,
    update_availability,
)
from tests.factories import create_clique, create_user
from tests.utils import assert_error, auth_headers


@pytest.mark.asyncio
async def test_availability_validation_and_permissions(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    other_user = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.commit()

    payload = {
        "is_recurring": False,
        "date": date.today().isoformat(),
        "start_time": time(9, 0).isoformat(),
        "end_time": time(10, 0).isoformat(),
        "timezone": "UTC",
    }

    created = await client.post(
        "/api/v1/availability/",
        params={"clique_id": str(clique.id)},
        json=payload,
        headers=auth_headers(make_token(owner)),
    )
    assert created.status_code == 200
    availability_id = created.json()["id"]

    list_owner = await client.get(
        f"/api/v1/availability/{clique.id}",
        headers=auth_headers(make_token(owner)),
    )
    assert list_owner.status_code == 200

    list_forbidden = await client.get(
        f"/api/v1/availability/{clique.id}",
        headers=auth_headers(make_token(other_user)),
    )
    assert list_forbidden.status_code == 403

    overlap = await client.post(
        "/api/v1/availability/",
        params={"clique_id": str(clique.id)},
        json=payload,
        headers=auth_headers(make_token(owner)),
    )
    assert overlap.status_code == 400

    forbidden = await client.put(
        f"/api/v1/availability/{availability_id}",
        json={"start_time": time(8, 0).isoformat()},
        headers=auth_headers(make_token(other_user)),
    )
    assert forbidden.status_code == 403

    invalid = await client.put(
        f"/api/v1/availability/{availability_id}",
        json={"end_time": time(8, 0).isoformat()},
        headers=auth_headers(make_token(owner)),
    )
    assert invalid.status_code == 400

    list_owner = await client.get(
        f"/api/v1/availability/{clique.id}",
        headers=auth_headers(make_token(owner)),
    )
    assert list_owner.status_code == 200


@pytest.mark.asyncio
async def test_availability_service_overlap_checks(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    data = AvailabilityCreate(
        is_recurring=True,
        day_of_week=1,
        start_time=time(9, 0),
        end_time=time(10, 0),
        timezone="UTC",
    )
    created = await create_availability(db_session, clique.id, data)
    assert created.day_of_week == 1

    with pytest.raises(ValueError):
        await create_availability(db_session, clique.id, data)

    updated = await update_availability(
        db_session,
        created.id,
        AvailabilityUpdate(end_time=time(11, 0)),
    )
    assert updated.end_time == time(11, 0)

    deleted = await delete_availability(db_session, created.id)
    assert deleted is True

    non_existing = await delete_availability(db_session, uuid4())
    assert non_existing is False


@pytest.mark.asyncio
async def test_availability_route_for_private_clique(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    member = await create_user(db_session)
    outsider = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    db_session.add(
        CliqueMember(
            clique_id=clique.id,
            user_id=member.id,
            role=Role.MEMBER,
            status=MembershipStatus.JOINED,
        )
    )
    await db_session.commit()

    payload = {
        "is_recurring": False,
        "date": date.today().isoformat(),
        "start_time": time(9, 0).isoformat(),
        "end_time": time(10, 0).isoformat(),
        "timezone": "UTC",
    }

    member_create = await client.post(
        "/api/v1/availability/",
        params={"clique_id": str(clique.id)},
        json=payload,
        headers=auth_headers(make_token(member)),
    )
    assert member_create.status_code == 403

    owner_create = await client.post(
        "/api/v1/availability/",
        params={"clique_id": str(clique.id)},
        json=payload,
        headers=auth_headers(make_token(owner)),
    )
    availability_id = owner_create.json()["id"]

    list_member = await client.get(
        f"/api/v1/availability/{clique.id}",
        headers=auth_headers(make_token(member)),
    )
    assert list_member.status_code == 200

    list_outsider = await client.get(
        f"/api/v1/availability/{clique.id}",
        headers=auth_headers(make_token(outsider)),
    )
    assert list_outsider.status_code == 403
    assert_error(list_outsider, "forbidden")

    update_resp = await client.put(
        f"/api/v1/availability/{availability_id}",
        json={"start_time": time(11, 0).isoformat()},
        headers=auth_headers(make_token(owner)),
    )
    assert update_resp.status_code == 200
    updated_payload = update_resp.json()
    assert updated_payload["start_time"] == "11:00:00"
    assert updated_payload["end_time"] == "12:00:00"

    delete_resp = await client.delete(
        f"/api/v1/availability/{availability_id}",
        headers=auth_headers(make_token(owner)),
    )
    assert delete_resp.status_code == 200

    delete_missing = await client.delete(
        f"/api/v1/availability/{availability_id}",
        headers=auth_headers(make_token(owner)),
    )
    assert delete_missing.status_code == 404


@pytest.mark.asyncio
async def test_partial_update_only_start_time_preserves_other_fields(
    client, db_session, make_token
):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    payload = {
        "is_recurring": False,
        "date": date.today().isoformat(),
        "start_time": time(9, 0).isoformat(),
        "end_time": time(10, 0).isoformat(),
        "timezone": "UTC",
    }
    created = await client.post(
        "/api/v1/availability/",
        params={"clique_id": str(clique.id)},
        json=payload,
        headers=auth_headers(make_token(owner)),
    )
    assert created.status_code == 200
    availability_id = created.json()["id"]

    update_resp = await client.put(
        f"/api/v1/availability/{availability_id}",
        json={"start_time": time(8, 30).isoformat()},
        headers=auth_headers(make_token(owner)),
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["start_time"] == "08:30:00"
    assert updated["end_time"] == "10:00:00"

    record = await db_session.get(Availability, availability_id)
    assert record is not None
    assert record.start_time.hour == 8 and record.start_time.minute == 30
    assert record.end_time.hour == 10 and record.day_of_week is None
