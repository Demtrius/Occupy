import pytest
from httpx import AsyncClient

from tests.factories import create_user
from tests.utils import assert_cursor_list, assert_error, assert_success, auth_headers


class TestUserProfile:
    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_get_public_profile(self, client: AsyncClient, db_session):
        """Test getting public user profile."""
        user = await create_user(db_session, is_private_account=False)
        viewer = await create_user(db_session)
        await db_session.commit()  # Commit users so they are visible to API requests
        resp = await client.get(
            f"/api/v1/users/{user.id}", headers=auth_headers(viewer)
        )
        assert_success(resp)
        result = resp.json()
        assert result["id"] == str(user.id)
        assert result["username"] == user.username

    @pytest.mark.asyncio
    async def test_get_private_profile_unauthorized(
        self, client: AsyncClient, db_session
    ):
        """Test getting private profile without auth fails."""
        user = await create_user(db_session, is_private_account=True)
        await db_session.commit()
        resp = await client.get(f"/api/v1/users/{user.id}")
        assert_error(resp, "http_error")


class TestFollows:
    @pytest.mark.asyncio
    async def test_follow_public_user(self, client: AsyncClient, db_session):
        """Test following a public user."""
        follower = await create_user(db_session)
        followee = await create_user(db_session, is_private_account=False)
        await db_session.commit()
        resp = await client.post(
            f"/api/v1/users/{followee.id}/follow", headers=auth_headers(follower)
        )
        assert_success(resp)
        result = resp.json()
        assert result["status"] == "accepted"

    @pytest.mark.asyncio
    async def test_follow_private_user(self, client: AsyncClient, db_session):
        """Test following a private user creates pending request."""
        follower = await create_user(db_session)
        followee = await create_user(db_session, is_private_account=True)
        await db_session.commit()
        resp = await client.post(
            f"/api/v1/users/{followee.id}/follow", headers=auth_headers(follower)
        )
        assert_success(resp)
        result = resp.json()
        assert result["status"] == "pending"

    @pytest.mark.asyncio
    async def test_approve_follow_request(self, client: AsyncClient, db_session):
        """Test approving a follow request."""
        follower = await create_user(db_session)
        followee = await create_user(db_session, is_private_account=True)
        await db_session.commit()
        # Follow first
        await client.post(
            f"/api/v1/users/{followee.id}/follow", headers=auth_headers(follower)
        )
        # Approve
        resp = await client.post(
            f"/api/v1/users/{follower.id}/follow/approve",
            headers=auth_headers(followee),
        )
        assert_success(resp)

    @pytest.mark.asyncio
    async def test_unfollow_user(self, client: AsyncClient, db_session):
        """Test unfollowing a user."""
        follower = await create_user(db_session)
        followee = await create_user(db_session)
        await db_session.commit()
        # Follow first
        await client.post(
            f"/api/v1/users/{followee.id}/follow", headers=auth_headers(follower)
        )
        # Unfollow
        resp = await client.delete(
            f"/api/v1/users/{followee.id}/follow", headers=auth_headers(follower)
        )
        assert_success(resp)


class TestBlocks:
    @pytest.mark.asyncio
    async def test_block_user(self, client: AsyncClient, db_session):
        """Test blocking a user."""
        blocker = await create_user(db_session)
        blocked = await create_user(db_session)
        await db_session.commit()
        resp = await client.post(
            f"/api/v1/users/{blocked.id}/follow/block", headers=auth_headers(blocker)
        )
        assert_success(resp)

    @pytest.mark.asyncio
    async def test_unblock_user(self, client: AsyncClient, db_session):
        """Test unblocking a user."""
        blocker = await create_user(db_session)
        blocked = await create_user(db_session)
        await db_session.commit()
        # Block first
        await client.post(
            f"/api/v1/users/{blocked.id}/follow/block", headers=auth_headers(blocker)
        )
        # Unblock
        resp = await client.delete(
            f"/api/v1/users/{blocked.id}/follow/block", headers=auth_headers(blocker)
        )
        assert_success(resp)


class TestPagination:
    @pytest.mark.asyncio
    async def test_get_followers_paginated(self, client: AsyncClient, db_session):
        """Test getting followers with cursor pagination."""
        user = await create_user(db_session)
        for _ in range(5):
            follower = await create_user(db_session)
            await client.post(
                f"/api/v1/users/{user.id}/follow", headers=auth_headers(follower)
            )
        await db_session.commit()
        resp = await client.get(
            f"/api/v1/users/{user.id}/follow/followers", headers=auth_headers(user)
        )
        assert_cursor_list(resp)
