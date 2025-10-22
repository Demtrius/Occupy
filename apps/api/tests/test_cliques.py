from __future__ import annotations

import pytest

from app.models.clique import CliqueMember
from app.models.enums import MembershipStatus, Privacy, Role
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
    assert join_response.json()["status"] == MembershipStatus.JOINED.value

    members_response = await client.get(
        f"/api/v1/cliques/{clique_id}/members",
        headers=auth_headers(make_token(owner)),
    )
    assert members_response.status_code == 200
    payload = members_response.json()
    assert_cursor_page(payload)
    member_ids = {member["userId"] for member in payload["items"]}
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


@pytest.mark.asyncio
async def test_private_clique_requires_membership(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    outsider = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/cliques/{clique.id}",
        headers=auth_headers(make_token(outsider)),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["privacy"] == Privacy.PRIVATE.value
    assert set(payload.keys()).issuperset({"id", "name", "description"})
    assert "owner_user_id" not in payload


@pytest.mark.asyncio
async def test_private_clique_invite_and_approval(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    invitee = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.commit()

    invite_resp = await client.post(
        f"/api/v1/cliques/{clique.id}/invites",
        json={},
        headers=auth_headers(make_token(owner)),
    )
    assert invite_resp.status_code == 201
    token = invite_resp.json()["token"]

    join_resp = await client.post(
        f"/api/v1/cliques/{clique.id}/join",
        params={"inviteToken": token},
        headers=auth_headers(make_token(invitee)),
    )
    assert join_resp.status_code == 200
    assert join_resp.json()["status"] == MembershipStatus.JOINED.value


@pytest.mark.asyncio
async def test_pending_membership_approval_routes(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    pending_user = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.commit()

    await client.post(
        f"/api/v1/cliques/{clique.id}/join",
        headers=auth_headers(make_token(pending_user)),
    )

    pending_resp = await client.get(
        f"/api/v1/cliques/{clique.id}/members/pending",
        headers=auth_headers(make_token(owner)),
    )
    assert pending_resp.status_code == 200
    pending_member_id = pending_resp.json()["items"][0]["id"]

    approve_resp = await client.post(
        f"/api/v1/cliques/{clique.id}/members/{pending_member_id}/approve",
        headers=auth_headers(make_token(owner)),
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == MembershipStatus.JOINED.value

    reject_resp = await client.post(
        f"/api/v1/cliques/{clique.id}/members/{pending_member_id}/reject",
        headers=auth_headers(make_token(owner)),
    )
    assert reject_resp.status_code == 200
    assert reject_resp.json()["status"] == "rejected"


@pytest.mark.asyncio
async def test_update_clique_field_validation(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    response = await client.patch(
        f"/api/v1/cliques/{clique.id}",
        json={"name": None},
        headers=auth_headers(make_token(owner)),
    )
    assert response.status_code == 404
    assert_error(response, "not_found")


@pytest.mark.asyncio
async def test_delete_clique_requires_owner(client, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    other = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    forbidden = await client.delete(
        f"/api/v1/cliques/{clique.id}",
        headers=auth_headers(make_token(other)),
    )
    assert forbidden.status_code == 403
    assert_error(forbidden, "forbidden")

    delete_resp = await client.delete(
        f"/api/v1/cliques/{clique.id}",
        headers=auth_headers(make_token(owner)),
    )
    assert delete_resp.status_code == 204


@pytest.mark.asyncio
async def test_list_clique_members_forbidden_for_outsider(
    client, db_session, make_token
):
    owner = await create_user(db_session, is_business_page=True)
    outsider = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/cliques/{clique.id}/members",
        headers=auth_headers(make_token(outsider)),
    )
    assert response.status_code == 403
    assert_error(response, "forbidden")
