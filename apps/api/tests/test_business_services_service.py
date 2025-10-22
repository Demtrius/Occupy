from __future__ import annotations

from uuid import uuid4

import pytest

from app.models.clique import CliqueMember
from app.models.enums import MembershipStatus, Privacy, Role
from tests.factories import create_clique, create_user
from tests.utils import assert_error, auth_headers


@pytest.mark.asyncio
async def test_service_routes_enforce_owner(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    other_user = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.commit()

    payload = {
        "title": "Consult",
        "description": "Initial consult",
        "price_minor": 1000,
        "currency": "EUR",
        "duration_minutes": 60,
        "buffer_minutes": 10,
    }

    forbidden = await client.post(
        "/api/v1/services",
        params={"cliqueId": str(clique.id)},
        json=payload,
        headers=auth_headers(make_token(other_user)),
    )
    assert forbidden.status_code == 403

    create = await client.post(
        "/api/v1/services",
        params={"cliqueId": str(clique.id)},
        json=payload,
        headers=auth_headers(make_token(owner)),
    )
    assert create.status_code == 201
    service_id = create.json()["id"]

    list_owner = await client.get(
        f"/api/v1/services/{clique.id}",
        headers=auth_headers(make_token(owner)),
    )
    assert list_owner.status_code == 200

    list_forbidden = await client.get(
        f"/api/v1/services/{clique.id}",
        headers=auth_headers(make_token(other_user)),
    )
    assert list_forbidden.status_code == 403
    assert_error(list_forbidden, "forbidden")

    update_resp = await client.put(
        f"/api/v1/services/{service_id}",
        json={"title": "Updated"},
        headers=auth_headers(make_token(other_user)),
    )
    assert update_resp.status_code == 403
    assert_error(update_resp, "forbidden")
    assert update_resp.json()["error"]["details"] == {}

    delete_resp = await client.delete(
        f"/api/v1/services/{service_id}",
        headers=auth_headers(make_token(owner)),
    )
    assert delete_resp.status_code == 200


@pytest.mark.asyncio
async def test_service_list_and_update_for_private_clique(
    client, db_session, make_token
):
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
        "title": "Consult",
        "price_minor": 5000,
        "currency": "USD",
        "duration_minutes": 30,
        "buffer_minutes": 5,
        "description": "",
    }

    create = await client.post(
        "/api/v1/services",
        params={"cliqueId": str(clique.id)},
        json=payload,
        headers=auth_headers(make_token(owner)),
    )
    service_id = create.json()["id"]

    member_list = await client.get(
        f"/api/v1/services/{clique.id}",
        headers=auth_headers(make_token(member)),
    )
    assert member_list.status_code == 200
    assert member_list.json()[0]["title"] == "Consult"

    outsider_list = await client.get(
        f"/api/v1/services/{clique.id}",
        headers=auth_headers(make_token(outsider)),
    )
    assert outsider_list.status_code == 403

    update = await client.put(
        f"/api/v1/services/{service_id}",
        json={"title": "Rebrand"},
        headers=auth_headers(make_token(owner)),
    )
    assert update.status_code == 200
    assert update.json()["title"] == "Rebrand"

    delete_missing = await client.delete(
        f"/api/v1/services/{uuid4()}",
        headers=auth_headers(make_token(owner)),
    )
    assert delete_missing.status_code == 404
