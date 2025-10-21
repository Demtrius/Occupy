from __future__ import annotations

import pytest

from app import main


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_main_initialization():
    assert main.app.title == "Occupy API"
