from __future__ import annotations

import pytest

from app.models.clique import CliqueMember
from app.models.enums import MembershipStatus, PostStatus, Privacy, Role
from tests.factories import create_clique, create_post, create_user
from tests.utils import assert_cursor_page, auth_headers


@pytest.mark.asyncio
async def test_get_user_posts_own_posts(client, db_session, make_token):
    """Test that users can see all their own posts via API."""
    user = await create_user(db_session)
    other_user = await create_user(db_session)

    # Create public and private cliques
    public_clique = await create_clique(db_session, owner=user, privacy=Privacy.PUBLIC)
    private_clique = await create_clique(db_session, owner=user, privacy=Privacy.PRIVATE)

    # Create posts in both cliques
    await create_post(db_session, clique=public_clique, author=user, status=PostStatus.POSTED)
    await create_post(db_session, clique=private_clique, author=user, status=PostStatus.POSTED)

    await db_session.commit()

    # User should see all their own posts
    response = await client.get(
        f"/api/v1/posts/user/{user.id}/posts",
        headers=auth_headers(make_token(user)),
    )
    assert response.status_code == 200
    payload = response.json()
    assert_cursor_page(payload)
    assert len(payload["items"]) == 2


@pytest.mark.asyncio
async def test_get_user_posts_other_user_public_only(client, db_session, make_token):
    """Test that other users can only see posts from public cliques via API."""
    owner = await create_user(db_session)
    viewer = await create_user(db_session)

    # Create public and private cliques
    public_clique = await create_clique(db_session, owner=owner, privacy=Privacy.PUBLIC)
    private_clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)

    # Create posts
    await create_post(db_session, clique=public_clique, author=owner, status=PostStatus.POSTED)
    await create_post(db_session, clique=private_clique, author=owner, status=PostStatus.POSTED)

    await db_session.commit()

    # Viewer should only see public post
    response = await client.get(
        f"/api/v1/posts/user/{owner.id}/posts",
        headers=auth_headers(make_token(viewer)),
    )
    assert response.status_code == 200
    payload = response.json()
    assert_cursor_page(payload)
    assert len(payload["items"]) == 1


@pytest.mark.asyncio
async def test_get_user_posts_member_sees_private(client, db_session, make_token):
    """Test that clique members can see posts from private cliques via API."""
    owner = await create_user(db_session)
    member = await create_user(db_session)

    # Create private clique and add member
    private_clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.refresh(private_clique)

    # Manually create membership
    membership = CliqueMember(
        clique_id=private_clique.id,
        user_id=member.id,
        role=Role.MEMBER,
        status=MembershipStatus.JOINED,
    )
    db_session.add(membership)

    # Create post in private clique
    await create_post(db_session, clique=private_clique, author=owner, status=PostStatus.POSTED)

    await db_session.commit()

    # Member should see private post
    response = await client.get(
        f"/api/v1/posts/user/{owner.id}/posts",
        headers=auth_headers(make_token(member)),
    )
    assert response.status_code == 200
    payload = response.json()
    assert_cursor_page(payload)
    assert len(payload["items"]) == 1


@pytest.mark.asyncio
async def test_get_user_cliques_own_cliques(client, db_session, make_token):
    """Test that users can see all their own cliques via API."""
    user = await create_user(db_session)

    # Create public and private cliques
    await create_clique(db_session, owner=user, privacy=Privacy.PUBLIC)
    await create_clique(db_session, owner=user, privacy=Privacy.PRIVATE)

    await db_session.commit()

    # User should see all their own cliques
    response = await client.get(
        f"/api/v1/cliques/user/{user.id}/cliques",
        headers=auth_headers(make_token(user)),
    )
    assert response.status_code == 200
    payload = response.json()
    assert_cursor_page(payload)
    assert len(payload["items"]) == 2


@pytest.mark.asyncio
async def test_get_user_cliques_other_user_public_only(client, db_session, make_token):
    """Test that other users can only see public cliques via API."""
    owner = await create_user(db_session)
    viewer = await create_user(db_session)

    # Create public and private cliques
    await create_clique(db_session, owner=owner, privacy=Privacy.PUBLIC)
    await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)

    await db_session.commit()

    # Viewer should only see public clique
    response = await client.get(
        f"/api/v1/cliques/user/{owner.id}/cliques",
        headers=auth_headers(make_token(viewer)),
    )
    assert response.status_code == 200
    payload = response.json()
    assert_cursor_page(payload)
    assert len(payload["items"]) == 1


@pytest.mark.asyncio
async def test_get_user_cliques_member_sees_private(client, db_session, make_token):
    """Test that clique members can see private cliques via API."""
    owner = await create_user(db_session)
    member = await create_user(db_session)

    # Create private clique and add member
    private_clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.refresh(private_clique)

    # Manually create membership
    membership = CliqueMember(
        clique_id=private_clique.id,
        user_id=member.id,
        role=Role.MEMBER,
        status=MembershipStatus.JOINED,
    )
    db_session.add(membership)

    await db_session.commit()

    # Member should see private clique
    response = await client.get(
        f"/api/v1/cliques/user/{owner.id}/cliques",
        headers=auth_headers(make_token(member)),
    )
    assert response.status_code == 200
    payload = response.json()
    assert_cursor_page(payload)
    assert len(payload["items"]) == 1


@pytest.mark.asyncio
async def test_get_user_posts_pagination(client, db_session, make_token):
    """Test pagination for user posts."""
    user = await create_user(db_session)
    clique = await create_clique(db_session, owner=user, privacy=Privacy.PUBLIC)

    # Create multiple posts
    for i in range(5):
        await create_post(db_session, clique=clique, author=user, status=PostStatus.POSTED)

    await db_session.commit()

    # Test pagination with limit 2
    response = await client.get(
        f"/api/v1/posts/user/{user.id}/posts?limit=2",
        headers=auth_headers(make_token(user)),
    )
    assert response.status_code == 200
    payload = response.json()
    assert_cursor_page(payload)
    assert len(payload["items"]) == 2
    assert payload["nextCursor"] is not None

    # Test next page
    next_response = await client.get(
        f"/api/v1/posts/user/{user.id}/posts?cursor={payload['nextCursor']}&limit=2",
        headers=auth_headers(make_token(user)),
    )
    assert next_response.status_code == 200
    next_payload = next_response.json()
    assert_cursor_page(next_payload)
    assert len(next_payload["items"]) == 2


@pytest.mark.asyncio
async def test_get_user_cliques_pagination(client, db_session, make_token):
    """Test pagination for user cliques."""
    user = await create_user(db_session)

    # Create multiple cliques
    for i in range(5):
        await create_clique(db_session, owner=user, privacy=Privacy.PUBLIC)

    await db_session.commit()

    # Test pagination with limit 2
    response = await client.get(
        f"/api/v1/cliques/user/{user.id}/cliques?limit=2",
        headers=auth_headers(make_token(user)),
    )
    assert response.status_code == 200
    payload = response.json()
    assert_cursor_page(payload)
    assert len(payload["items"]) == 2
    assert payload["nextCursor"] is not None

    # Test next page
    next_response = await client.get(
        f"/api/v1/cliques/user/{user.id}/cliques?cursor={payload['nextCursor']}&limit=2",
        headers=auth_headers(make_token(user)),
    )
    assert next_response.status_code == 200
    next_payload = next_response.json()
    assert_cursor_page(next_payload)
    assert len(next_payload["items"]) == 2