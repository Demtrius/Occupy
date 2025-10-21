from __future__ import annotations

import pytest

from app.models.clique import CliqueMember
from app.models.enums import MembershipStatus, Role
from tests.factories import create_clique, create_post, create_user
from tests.utils import assert_cursor_page, assert_error, auth_headers


@pytest.mark.asyncio
async def test_business_user_can_create_clique(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    await db_session.commit()

    payload = {
        "name": "Studio 54",
        "description": "Legendary events",
        "privacy": "public",
        "timezone": "UTC",
        "occupation_ids": [],
        "cancellation_cutoff_hours": 12,
    }

    response = await client.post(
        "/api/v1/cliques",
        json=payload,
        headers=auth_headers(make_token(owner)),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == payload["name"]


@pytest.mark.asyncio
async def test_non_business_user_cannot_create_clique(client, db_session, make_token):
    user = await create_user(db_session, is_business_page=False)
    await db_session.commit()

    response = await client.post(
        "/api/v1/cliques",
        json={
            "name": "Closed Group",
            "description": "",
            "privacy": "public",
            "timezone": "UTC",
            "occupation_ids": [],
        },
        headers=auth_headers(make_token(user)),
    )

    assert response.status_code == 403
    assert_error(response, "forbidden")


@pytest.mark.asyncio
async def test_join_and_list_members(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    joiner = await create_user(db_session)
    await db_session.commit()

    create_payload = {
        "name": "Public Lounge",
        "description": "",
        "privacy": "public",
        "timezone": "UTC",
        "occupation_ids": [],
    }

    create_response = await client.post(
        "/api/v1/cliques",
        json=create_payload,
        headers=auth_headers(make_token(owner)),
    )
    clique_id = create_response.json()["id"]

    join_response = await client.post(
        f"/api/v1/cliques/{clique_id}/join",
        headers=auth_headers(make_token(joiner)),
    )
    assert join_response.status_code == 200

    members_response = await client.get(
        f"/api/v1/cliques/{clique_id}/members",
        headers=auth_headers(make_token(owner)),
    )
    assert members_response.status_code == 200
    payload = members_response.json()
    assert_cursor_page(payload)
    member_ids = {member["user_id"] for member in payload["items"]}
    assert str(joiner.id) in member_ids


@pytest.mark.asyncio
async def test_feed_returns_recent_posts(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    member = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    await create_post(db_session, clique=clique, author=owner)

    db_session.add(
        CliqueMember(
            clique_id=clique.id,
            user_id=member.id,
            role=Role.MEMBER,
            status=MembershipStatus.JOINED,
        )
    )
    await db_session.commit()

    response = await client.get(
        "/api/v1/cliques/feed",
        headers=auth_headers(make_token(member)),
    )
    assert response.status_code == 200
    feed_payload = response.json()
    assert_cursor_page(feed_payload)
    assert feed_payload["items"]
