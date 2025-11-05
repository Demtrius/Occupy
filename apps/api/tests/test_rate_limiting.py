from __future__ import annotations

import pytest
from fastapi import Request
from starlette.routing import Route

from app.core.limiter import limiter
from app.main import app
from tests.utils import assert_error


@pytest.mark.asyncio
async def test_rate_limiting_triggers(enable_rate_limits, client):
    @limiter.limit("1/minute")
    async def limited(request: Request):
        return {"ok": True}

    app.router.add_api_route(
        "/__test/limited", limited, methods=["GET"], name="limited-test"
    )
    try:
        first = await client.get("/__test/limited")
        assert first.status_code == 200

        second = await client.get("/__test/limited")
        assert second.status_code == 429
        assert second.json()["detail"].startswith("1 per")
    finally:
        app.router.routes = [
            route
            for route in app.router.routes
            if not (isinstance(route, Route) and route.endpoint is limited)
        ]
