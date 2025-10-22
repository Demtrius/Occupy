from __future__ import annotations

import pytest

from app.services.search import unified_search
from tests.factories import create_clique, create_post, create_user
from app.models.user import Occupation


@pytest.mark.asyncio
async def test_unified_search_service(db_session):
    user = await create_user(db_session, username="alicia")
    user.full_name = "Alicia Keys"
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner, name="Key Collective")
    await create_post(db_session, clique=clique, author=owner)
    occupation = Occupation(name="Key Maker", slug="key-maker")
    db_session.add(occupation)
    await db_session.commit()

    result = await unified_search(db_session, "key", limit=9)
    assert any(item.username == "alicia" for item in result.users)
    assert any(item.name == "Key Maker" for item in result.occupations)
    assert any(item.name == "Key Collective" for item in result.cliques)
