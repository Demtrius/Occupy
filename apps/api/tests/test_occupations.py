from __future__ import annotations

import pytest
from sqlalchemy import insert

from app.models.user import Occupation
from tests.factories import create_clique, create_user
from tests.utils import auth_headers


@pytest.mark.asyncio
async def test_list_and_search_occupations(client, db_session):
    occupations = [
        Occupation(name="Barber", slug="barber"),
        Occupation(name="Stylist", slug="stylist"),
    ]
    db_session.add_all(occupations)
    await db_session.commit()

    list_resp = await client.get("/api/v1/occupations")
    assert list_resp.status_code == 200
    names = {item["name"] for item in list_resp.json()}
    assert {"Barber", "Stylist"}.issubset(names)

    search_resp = await client.get("/api/v1/occupations/search", params={"q": "bar"})
    assert search_resp.status_code == 200
    search_names = {item["name"] for item in search_resp.json()}
    assert "Barber" in search_names


@pytest.mark.asyncio
async def test_update_user_occupations(client, db_session, make_token):
    occupation = Occupation(name="Photographer", slug="photographer")
    db_session.add(occupation)
    await db_session.flush()

    user = await create_user(db_session)
    await db_session.commit()

    response = await client.put(
        "/api/v1/occupations/user",
        json=[str(occupation.id)],
        headers=auth_headers(make_token(user)),
    )
    assert response.status_code == 200
