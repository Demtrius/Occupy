from __future__ import annotations

from uuid import uuid4

import pytest

from tests.factories import create_follow, create_user
from tests.utils import assert_error, auth_headers


@pytest.mark.asyncio
async def test_search_users_by_query(client, db_session, make_token):
    actor = await create_user(
        db_session,
        email="actor@example.com",
        username="actor_user",
    )
    match = await create_user(
        db_session,
        email="match@example.com",
        username="matchmaker",
    )
    await create_user(
        db_session,
        email="other@example.com",
        username="otherperson",
    )
    await db_session.commit()

    response = await client.get(
        "/api/v1/users",
        params={"q": "match"},
        headers=auth_headers(make_token(actor)),
    )
    assert response.status_code == 200
    payload = response.json()
    assert any(item["id"] == str(match.id) for item in payload["items"])


@pytest.mark.asyncio
async def test_private_user_requires_follow_or_owner(client, db_session, make_token):
    viewer = await create_user(
        db_session,
        email="viewer@example.com",
        username="viewer_user",
    )
    private_user = await create_user(
        db_session,
        email="private@example.com",
        username="private_user",
        is_private_account=True,
    )
    await db_session.commit()

    forbidden_view = await client.get(
        f"/api/v1/users/{private_user.id}",
        headers=auth_headers(make_token(viewer)),
    )
    assert forbidden_view.status_code == 404
    assert_error(forbidden_view, "not_found")

    await create_follow(db_session, follower=viewer, followee=private_user)
    await db_session.commit()

    allowed_view = await client.get(
        f"/api/v1/users/{private_user.id}",
        headers=auth_headers(make_token(viewer)),
    )
    assert allowed_view.status_code == 200
    data = allowed_view.json()
    assert data["id"] == str(private_user.id)


@pytest.mark.asyncio
async def test_get_user_not_found(client, db_session, make_token):
    viewer = await create_user(db_session)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/users/{uuid4()}",
        headers=auth_headers(make_token(viewer)),
    )
    assert response.status_code == 404
    assert_error(response, "not_found")


@pytest.mark.asyncio
async def test_get_and_update_me(client, db_session, make_token):
    user = await create_user(db_session)
    await db_session.commit()

    me_response = await client.get(
        "/api/v1/users/me",
        headers=auth_headers(make_token(user)),
    )
    assert me_response.status_code == 200, me_response.text
    assert me_response.json()["full_name"] == user.full_name

    update_response = await client.patch(
        "/api/v1/users/me",
        json={"full_name": "Updated"},
        headers=auth_headers(make_token(user)),
    )
    assert update_response.status_code == 200
    assert update_response.json()["full_name"] == "Updated"
