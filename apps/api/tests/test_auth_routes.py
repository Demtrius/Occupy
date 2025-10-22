from __future__ import annotations

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from tests.factories import create_user
from tests.utils import assert_error, auth_headers


@pytest.mark.asyncio
async def test_auth_register_login_refresh_logout_flow(client):
    register_payload = {
        "email": "user@example.com",
        "username": "testuser",
        "password": "Passw0rd!",
        "full_name": "Test User",
        "bio": None,
        "profile_image_url": None,
        "is_admin": False,
        "is_active": True,
        "is_private_account": False,
        "is_business_page": False,
    }

    register = await client.post("/api/v1/auth/register", json=register_payload)
    assert register.status_code == 201
    tokens = register.json()
    assert "accessToken" in tokens

    duplicate = await client.post("/api/v1/auth/register", json=register_payload)
    assert duplicate.status_code == 409
    assert_error(duplicate, "conflict")

    login = await client.post(
        "/api/v1/auth/login",
        json={
            "email_or_username": register_payload["email"],
            "password": register_payload["password"],
        },
    )
    assert login.status_code == 200
    login_tokens = login.json()

    refresh = await client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": login_tokens["refreshToken"]},
    )
    assert refresh.status_code == 200
    refreshed = refresh.json()

    logout = await client.post(
        "/api/v1/auth/logout",
        json={"refreshToken": login_tokens["refreshToken"]},
        headers=auth_headers(tokens["accessToken"]),
    )
    assert logout.status_code == 200

    reuse_refresh = await client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": login_tokens["refreshToken"]},
    )
    assert reuse_refresh.status_code == 401
    assert_error(reuse_refresh, "http_error")


@pytest.mark.asyncio
async def test_register_token_store_failure(client, monkeypatch):
    async def failing_store(*_args, **_kwargs):
        raise RuntimeError("store unavailable")

    payload = {
        "email": f"{uuid4()}@example.com",
        "username": f"user_{uuid4().hex[:6]}",
        "password": "Passw0rd!",
        "full_name": "Failure Case",
        "bio": None,
        "profile_image_url": None,
        "is_admin": False,
        "is_active": True,
        "is_private_account": False,
        "is_business_page": False,
    }

    monkeypatch.setattr("app.api.routes.auth.store_refresh_token", failing_store)
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 503
    assert_error(response, "http_error")


@pytest.mark.asyncio
async def test_login_invalid_credentials(client, db_session):
    user = await create_user(db_session)
    await db_session.commit()

    response = await client.post(
        "/api/v1/auth/login",
        json={"email_or_username": user.email, "password": "wrong"},
    )
    assert response.status_code == 401
    assert_error(response, "http_error")


@pytest.mark.asyncio
async def test_refresh_invalid_token(client):
    response = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": "invalid-token"}
    )
    assert response.status_code == 401
    assert_error(response, "http_error")


async def _register_user(client, *, email: str, username: str) -> dict[str, str]:
    payload = {
        "email": email,
        "username": username,
        "password": "Passw0rd!",
        "full_name": "Tester",
        "bio": None,
        "profile_image_url": None,
        "is_admin": False,
        "is_active": True,
        "is_private_account": False,
        "is_business_page": False,
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    return response.json()


@pytest.mark.asyncio
async def test_refresh_revoked_token(client, monkeypatch):
    tokens = await _register_user(
        client,
        email=f"revoked_{uuid4()}@example.com",
        username=f"revoked_{uuid4().hex[:6]}",
    )

    monkeypatch.setattr(
        "app.api.routes.auth.is_refresh_token_active", AsyncMock(return_value=False)
    )

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": tokens["refreshToken"]},
    )
    assert response.status_code == 401
    assert_error(response, "http_error")


@pytest.mark.asyncio
async def test_refresh_store_failure_after_revoke(client, monkeypatch):
    tokens = await _register_user(
        client,
        email=f"refresh_{uuid4()}@example.com",
        username=f"refresh_{uuid4().hex[:6]}",
    )

    monkeypatch.setattr(
        "app.api.routes.auth.is_refresh_token_active", AsyncMock(return_value=True)
    )
    monkeypatch.setattr(
        "app.api.routes.auth.revoke_refresh_token", AsyncMock(return_value=None)
    )

    async def failing_store(*_args, **_kwargs):
        raise RuntimeError("store down")

    monkeypatch.setattr("app.api.routes.auth.store_refresh_token", failing_store)

    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": tokens["refreshToken"]},
    )
    assert response.status_code == 503
    assert_error(response, "http_error")


@pytest.mark.asyncio
async def test_logout_invalid_refresh_token(client):
    tokens = await _register_user(
        client,
        email=f"logout_{uuid4()}@example.com",
        username=f"logout_{uuid4().hex[:6]}",
    )

    response = await client.post(
        "/api/v1/auth/logout",
        json={"refreshToken": "junk"},
        headers=auth_headers(tokens["accessToken"]),
    )
    assert response.status_code == 401
    assert_error(response, "http_error")


@pytest.mark.asyncio
async def test_logout_revoke_failure(client, monkeypatch):
    tokens = await _register_user(
        client,
        email=f"logoutfail_{uuid4()}@example.com",
        username=f"logoutfail_{uuid4().hex[:6]}",
    )

    monkeypatch.setattr(
        "app.api.routes.auth.is_refresh_token_active", AsyncMock(return_value=True)
    )

    async def failing_revoke(*_args, **_kwargs):
        raise RuntimeError("revoke failed")

    monkeypatch.setattr("app.api.routes.auth.revoke_refresh_token", failing_revoke)

    response = await client.post(
        "/api/v1/auth/logout",
        json={"refreshToken": tokens["refreshToken"]},
        headers=auth_headers(tokens["accessToken"]),
    )
    assert response.status_code == 503
    assert_error(response, "http_error")
