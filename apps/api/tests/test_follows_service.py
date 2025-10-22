from __future__ import annotations

import pytest

from app.models.enums import FollowStatus
from app.services.follows import (
    approve_follow,
    block_user,
    follow_user,
    get_followers,
    get_following,
    unblock_user,
    unfollow_user,
)
from tests.factories import create_user


@pytest.mark.asyncio
async def test_follow_and_unfollow_flow(db_session):
    follower = await create_user(db_session)
    followee = await create_user(db_session, is_private_account=True)
    await db_session.commit()

    relation = await follow_user(db_session, str(follower.id), str(followee.id))
    assert relation.status == FollowStatus.PENDING

    approved = await approve_follow(db_session, str(followee.id), str(follower.id))
    assert approved is not None
    assert approved.status == FollowStatus.ACCEPTED
    followers, _ = await get_followers(db_session, str(followee.id), None, 10)
    assert any(f.follower_user_id == follower.id for f in followers)

    await unfollow_user(db_session, str(follower.id), str(followee.id))
    followers_after, _ = await get_followers(db_session, str(followee.id), None, 10)
    assert all(f.follower_user_id != follower.id for f in followers_after)


@pytest.mark.asyncio
async def test_block_and_unblock(db_session):
    blocker = await create_user(db_session)
    blocked = await create_user(db_session)
    await db_session.commit()

    blocked_relation = await block_user(db_session, str(blocker.id), str(blocked.id))
    assert blocked_relation.status == FollowStatus.BLOCKED
    followers, _ = await get_followers(db_session, str(blocked.id), None, 10)
    assert not followers

    unblocked = await unblock_user(db_session, str(blocker.id), str(blocked.id))
    assert unblocked is True
    following, _ = await get_following(db_session, str(blocker.id), None, 10)
    assert not following
