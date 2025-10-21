from __future__ import annotations

import pytest

from app.models.enums import Privacy
from app.services.cliques import (
    create_clique,
    get_feed_posts,
    get_clique_members,
    join_clique,
    leave_clique,
    update_clique_details,
)
from app.schemas.clique import CliqueUpdate
from tests.factories import create_clique, create_post, create_user


@pytest.mark.asyncio
async def test_join_leave_clique(db_session):
    owner = await create_user(db_session, is_business_page=True)
    member = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PUBLIC)
    await db_session.commit()

    await join_clique(db_session, str(member.id), str(clique.id))
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
