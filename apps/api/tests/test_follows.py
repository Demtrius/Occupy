import pytest
from uuid import uuid4

from app.models.enums import FollowStatus
from tests.factories import create_user
from tests.utils import assert_cursor_page, assert_error, auth_headers


@pytest.mark.asyncio
async def test_follow_and_list(client, db_session, make_token):
    follower = await create_user(db_session)
    followee = await create_user(db_session, is_private_account=False)
    await db_session.commit()

    follow_response = await client.post(
        f"/api/v1/users/{followee.id}/follow",
        headers=auth_headers(make_token(follower)),
    )
    assert follow_response.status_code == 200
    assert follow_response.json()["status"] == FollowStatus.ACCEPTED.value

    followers = await client.get(
        f"/api/v1/users/{followee.id}/follow/followers",
        headers=auth_headers(make_token(followee)),
    )
    assert followers.status_code == 200
    payload = followers.json()
    assert_cursor_page(payload)
    ids = {row["follower_user_id"] for row in payload["items"]}
    assert str(follower.id) in ids


@pytest.mark.asyncio
async def test_remove_follower_requires_owner(client, db_session, make_token):
    follower = await create_user(db_session)
    followee = await create_user(db_session)
    await db_session.commit()

    await client.post(
        f"/api/v1/users/{followee.id}/follow",
        headers=auth_headers(make_token(follower)),
    )

    response = await client.delete(
        f"/api/v1/users/{followee.id}/follow/followers/{follower.id}",
        headers=auth_headers(make_token(follower)),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_block_and_unblock_routes(client, db_session, make_token):
    blocker = await create_user(db_session)
    blocked = await create_user(db_session)
    await db_session.commit()

    block_resp = await client.post(
        f"/api/v1/users/{blocked.id}/follow/block",
        headers=auth_headers(make_token(blocker)),
    )
    assert block_resp.status_code == 200
    assert block_resp.json()["status"] == FollowStatus.BLOCKED.value

    unblock_resp = await client.delete(
        f"/api/v1/users/{blocked.id}/follow/block",
        headers=auth_headers(make_token(blocker)),
    )
    assert unblock_resp.status_code == 200
    assert unblock_resp.json()["status"] == "unblocked"


@pytest.mark.asyncio
async def test_follow_validation_errors(client, db_session, make_token):
    user = await create_user(db_session)
    other = await create_user(db_session)
    await db_session.commit()

    self_follow = await client.post(
        f"/api/v1/users/{user.id}/follow",
        headers=auth_headers(make_token(user)),
    )
    assert self_follow.status_code == 400

    await client.post(
        f"/api/v1/users/{other.id}/follow/block",
        headers=auth_headers(make_token(user)),
    )

    blocked_attempt = await client.post(
        f"/api/v1/users/{user.id}/follow",
        headers=auth_headers(make_token(other)),
    )
    assert blocked_attempt.status_code == 403


@pytest.mark.asyncio
async def test_follow_approval_flow(client, db_session, make_token):
    owner = await create_user(db_session)
    private_user = await create_user(db_session, is_private_account=True)
    await db_session.commit()

    pending = await client.post(
        f"/api/v1/users/{private_user.id}/follow",
        headers=auth_headers(make_token(owner)),
    )
    assert pending.status_code == 200
    assert pending.json()["status"] == FollowStatus.PENDING.value

    approve = await client.post(
        f"/api/v1/users/{owner.id}/follow/approve",
        headers=auth_headers(make_token(private_user)),
    )
    assert approve.status_code == 200
    assert approve.json()["status"] == FollowStatus.ACCEPTED.value

    reject = await client.post(
        f"/api/v1/users/{owner.id}/follow/reject",
        headers=auth_headers(make_token(private_user)),
    )
    assert reject.status_code == 200
    assert reject.json()["status"] == "rejected"


@pytest.mark.asyncio
async def test_follow_user_not_found(client, db_session, make_token):
    follower = await create_user(db_session)
    await db_session.commit()

    response = await client.post(
        f"/api/v1/users/{uuid4()}/follow",
        headers=auth_headers(make_token(follower)),
    )
    assert response.status_code == 400
    assert_error(response, "validation_error")


@pytest.mark.asyncio
async def test_approve_follow_not_found(client, db_session, make_token):
    user = await create_user(db_session)
    await db_session.commit()

    response = await client.post(
        f"/api/v1/users/{uuid4()}/follow/approve",
        headers=auth_headers(make_token(user)),
    )
    assert response.status_code == 404
    assert_error(response, "not_found")
