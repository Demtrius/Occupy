import pytest

from app.models.enums import FollowStatus
from tests.factories import create_user
from tests.utils import assert_cursor_page, auth_headers


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
