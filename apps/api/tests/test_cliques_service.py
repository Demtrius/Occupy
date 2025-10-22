from __future__ import annotations

import pytest

from app.models.enums import MembershipStatus, Privacy
from app.services.cliques import (
    approve_member,
    create_clique,
    create_invite,
    get_feed_posts,
    get_clique_members,
    get_pending_members,
    join_clique,
    leave_clique,
    reject_member,
    update_clique_details,
)
from app.schemas.clique import CliqueInviteCreate, CliqueUpdate
from tests.factories import create_clique, create_post, create_user


@pytest.mark.asyncio
async def test_join_leave_clique(db_session):
    owner = await create_user(db_session, is_business_page=True)
    member = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PUBLIC)
    await db_session.commit()

    membership = await join_clique(db_session, str(member.id), str(clique.id))
    assert membership.status == MembershipStatus.JOINED
    members, _ = await get_clique_members(db_session, str(clique.id), None, 10)
    assert any(m.user_id == member.id for m in members)

    await leave_clique(db_session, str(member.id), str(clique.id))
    members_after, _ = await get_clique_members(db_session, str(clique.id), None, 10)
    assert all(m.user_id != member.id for m in members_after)


@pytest.mark.asyncio
async def test_update_clique(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    updated = await update_clique_details(
        db_session,
        str(clique.id),
        CliqueUpdate(name="Renamed"),
    )
    assert updated.name == "Renamed"


@pytest.mark.asyncio
async def test_feed_posts(db_session):
    owner = await create_user(db_session, is_business_page=True)
    follower = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    await create_post(db_session, clique=clique, author=owner)
    await db_session.commit()

    await join_clique(db_session, str(follower.id), str(clique.id))
    posts, _ = await get_feed_posts(db_session, str(follower.id), None, 10)
    assert posts


@pytest.mark.asyncio
async def test_invite_and_pending_member_flow(db_session):
    owner = await create_user(db_session, is_business_page=True)
    invitee = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.commit()

    invite = await create_invite(
        db_session,
        str(clique.id),
        CliqueInviteCreate(),
    )
    assert invite.token

    membership = await join_clique(
        db_session,
        str(invitee.id),
        str(clique.id),
        invite.token,
    )
    assert membership.status == MembershipStatus.JOINED

    pending_user = await create_user(db_session)
    await join_clique(db_session, str(pending_user.id), str(clique.id))
    pending, _ = await get_pending_members(db_session, str(clique.id), None, 10)
    assert any(m.user_id == pending_user.id for m in pending)

    membership = await approve_member(db_session, str(clique.id), str(pending[0].id))
    assert membership.status == MembershipStatus.JOINED

    await reject_member(db_session, str(clique.id), str(pending[0].id))
    members, _ = await get_clique_members(db_session, str(clique.id), None, 10)
    assert all(m.id != pending[0].id for m in members)


@pytest.mark.asyncio
async def test_join_with_invalid_invite(db_session):
    owner = await create_user(db_session, is_business_page=True)
    user = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.commit()

    with pytest.raises(ValueError):
        await join_clique(db_session, str(user.id), str(clique.id), "bad-token")
