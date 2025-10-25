from __future__ import annotations

import pytest

from app.services.posts import get_user_posts
from app.services.cliques import get_user_cliques
from app.models.enums import Privacy, PostStatus, MembershipStatus
from tests.factories import create_clique, create_post, create_user


@pytest.mark.asyncio
async def test_get_user_posts_own_posts(db_session):
    """Test that users can see all their own posts."""
    user = await create_user(db_session)
    other_user = await create_user(db_session)

    # Create public and private cliques
    public_clique = await create_clique(db_session, owner=user, privacy=Privacy.PUBLIC)
    private_clique = await create_clique(db_session, owner=user, privacy=Privacy.PRIVATE)

    # Create posts in both cliques
    public_post = await create_post(db_session, clique=public_clique, author=user, status=PostStatus.POSTED)
    private_post = await create_post(db_session, clique=private_clique, author=user, status=PostStatus.POSTED)

    await db_session.commit()

    # User should see all their own posts
    posts, next_cursor = await get_user_posts(db_session, str(user.id), str(user.id), None, 50)
    post_ids = {post.id for post in posts}
    assert public_post.id in post_ids
    assert private_post.id in post_ids
    assert next_cursor is None


@pytest.mark.asyncio
async def test_get_user_posts_other_user_public_only(db_session):
    """Test that other users can only see posts from public cliques or cliques they're members of."""
    owner = await create_user(db_session)
    viewer = await create_user(db_session)

    # Create public and private cliques
    public_clique = await create_clique(db_session, owner=owner, privacy=Privacy.PUBLIC)
    private_clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)

    # Create posts
    public_post = await create_post(db_session, clique=public_clique, author=owner, status=PostStatus.POSTED)
    private_post = await create_post(db_session, clique=private_clique, author=owner, status=PostStatus.POSTED)

    await db_session.commit()

    # Viewer should only see public post
    posts, next_cursor = await get_user_posts(db_session, str(owner.id), str(viewer.id), None, 50)
    post_ids = {post.id for post in posts}
    assert public_post.id in post_ids
    assert private_post.id not in post_ids
    assert next_cursor is None


@pytest.mark.asyncio
async def test_get_user_posts_member_sees_private(db_session):
    """Test that clique members can see posts from private cliques."""
    owner = await create_user(db_session)
    member = await create_user(db_session)

    # Create private clique and add member
    private_clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.refresh(private_clique)  # Ensure clique is committed

    # Manually create membership since factory might not handle it
    from app.models.clique import CliqueMember
    from app.models.enums import Role
    membership = CliqueMember(
        clique_id=private_clique.id,
        user_id=member.id,
        role=Role.MEMBER,
        status=MembershipStatus.JOINED,
    )
    db_session.add(membership)

    # Create post in private clique
    private_post = await create_post(db_session, clique=private_clique, author=owner, status=PostStatus.POSTED)

    await db_session.commit()

    # Member should see private post
    posts, next_cursor = await get_user_posts(db_session, str(owner.id), str(member.id), None, 50)
    post_ids = {post.id for post in posts}
    assert private_post.id in post_ids
    assert next_cursor is None


@pytest.mark.asyncio
async def test_get_user_cliques_own_cliques(db_session):
    """Test that users can see all their own cliques."""
    user = await create_user(db_session)

    # Create public and private cliques
    public_clique = await create_clique(db_session, owner=user, privacy=Privacy.PUBLIC)
    private_clique = await create_clique(db_session, owner=user, privacy=Privacy.PRIVATE)

    await db_session.commit()

    # User should see all their own cliques
    cliques, next_cursor = await get_user_cliques(db_session, str(user.id), str(user.id), None, 50)
    clique_ids = {clique.id for clique in cliques}
    assert public_clique.id in clique_ids
    assert private_clique.id in clique_ids
    assert next_cursor is None


@pytest.mark.asyncio
async def test_get_user_cliques_other_user_public_only(db_session):
    """Test that other users can only see public cliques or cliques they're members of."""
    owner = await create_user(db_session)
    viewer = await create_user(db_session)

    # Create public and private cliques
    public_clique = await create_clique(db_session, owner=owner, privacy=Privacy.PUBLIC)
    private_clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)

    await db_session.commit()

    # Viewer should only see public clique
    cliques, next_cursor = await get_user_cliques(db_session, str(owner.id), str(viewer.id), None, 50)
    clique_ids = {clique.id for clique in cliques}
    assert public_clique.id in clique_ids
    assert private_clique.id not in clique_ids
    assert next_cursor is None


@pytest.mark.asyncio
async def test_get_user_cliques_member_sees_private(db_session):
    """Test that clique members can see private cliques."""
    owner = await create_user(db_session)
    member = await create_user(db_session)

    # Create private clique and add member
    private_clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.refresh(private_clique)

    # Manually create membership
    from app.models.clique import CliqueMember
    from app.models.enums import Role
    membership = CliqueMember(
        clique_id=private_clique.id,
        user_id=member.id,
        role=Role.MEMBER,
        status=MembershipStatus.JOINED,
    )
    db_session.add(membership)

    await db_session.commit()

    # Member should see private clique
    cliques, next_cursor = await get_user_cliques(db_session, str(owner.id), str(member.id), None, 50)
    clique_ids = {clique.id for clique in cliques}
    assert private_clique.id in clique_ids
    assert next_cursor is None