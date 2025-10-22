from __future__ import annotations

import pytest

from app.models.clique import Clique
from app.models.user import Occupation
from tests.factories import create_clique, create_user


@pytest.mark.asyncio
async def test_unified_search_returns_results(client, db_session):
    user = await create_user(db_session, username="saria")
    user.full_name = "Saria Sun"
    clique_owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=clique_owner, name="Sunrise Studios")
    occupation = Occupation(name="Sun Photographer", slug="sun-photographer")
    db_session.add(occupation)
    await db_session.commit()

    response = await client.get("/api/v1/search", params={"q": "sun"})
    assert response.status_code == 200
    data = response.json()
    assert any(item["username"] == "saria" for item in data["users"])
    assert any(item["name"] == "Sun Photographer" for item in data["occupations"])
    assert any(item["name"] == "Sunrise Studios" for item in data["cliques"])
