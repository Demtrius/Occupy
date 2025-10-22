from __future__ import annotations

import pytest

from app.api.deps import (
    check_blocking,
    parse_limit_cursor,
    parse_sort,
    require_clique_member,
    require_clique_owner,
)
from app.core.errors import Forbidden, NotFound
from app.models.clique import CliqueMember
from app.models.enums import FollowStatus, MembershipStatus, Role
from app.models.user import Follow
from tests.factories import create_clique, create_user


@pytest.mark.asyncio
async def test_require_clique_owner(db_session):
    owner = await create_user(db_session, is_business_page=True)
    other = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    result = await require_clique_owner(clique.id, owner, db_session)
    assert result.id == clique.id

    with pytest.raises(Forbidden):
        await require_clique_owner(clique.id, other, db_session)


@pytest.mark.asyncio
async def test_require_clique_member(db_session):
    owner = await create_user(db_session, is_business_page=True)
    member = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner)
    membership = CliqueMember(
        clique_id=clique.id,
        user_id=member.id,
        role=Role.MEMBER,
        status=MembershipStatus.JOINED,
    )
    db_session.add(membership)
    await db_session.commit()

    result = await require_clique_member(clique.id, member, db_session)
    assert result.user_id == member.id

    outsider = await create_user(db_session)
    with pytest.raises(Forbidden):
        await require_clique_member(clique.id, outsider, db_session)


@pytest.mark.asyncio
async def test_check_blocking(db_session):
    user_a = await create_user(db_session)
    user_b = await create_user(db_session)
    follow = Follow(
        follower_user_id=user_a.id,
        followee_user_id=user_b.id,
        status=FollowStatus.BLOCKED,
    )
    db_session.add(follow)
    await db_session.commit()

    with pytest.raises(NotFound):
        await check_blocking(user_b.id, user_a.id, db_session)


def test_parse_sort_and_limit():
    assert parse_sort(None) == ("created_at", "desc")
    assert parse_sort("name:asc") == ("name", "asc")
    assert parse_sort("updatedAt") == ("updatedAt", "desc")

    limit, cursor = parse_limit_cursor(120, "abc")
    assert limit == 50
    assert cursor == "abc"

    limit_default, cursor_none = parse_limit_cursor(None, None)
    assert limit_default == 20
    assert cursor_none is None
