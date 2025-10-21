import pytest

from app.core.auth import verify_password
from app.models.user import User
from tests.utils import assert_error


@pytest.mark.asyncio
async def test_register_creates_user(client, faker, db_session):
    payload = {
        "email": faker.unique.email(),
        "username": faker.unique.user_name(),
        "password": "Str0ngPass!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == payload["email"]

    user_id = data["user"]["id"]
    user = await db_session.get(User, user_id)
    assert user is not None
    assert verify_password(payload["password"], user.password_hash)


@pytest.mark.asyncio
async def test_register_duplicate_email(client, faker):
    payload = {
        "email": faker.unique.email(),
        "username": faker.unique.user_name(),
        "password": "Str0ngPass!",
    }
    first = await client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201

    duplicate = await client.post("/api/v1/auth/register", json=payload)
    assert duplicate.status_code == 409
    assert_error(duplicate, "conflict")


@pytest.mark.asyncio
async def test_login_success(client, faker):
    email = faker.unique.email()
    credentials = {
        "email": email,
        "username": faker.unique.user_name(),
        "password": "Str0ngPass!",
    }
    await client.post("/api/v1/auth/register", json=credentials)

    login_payload = {
        "email_or_username": email,
        "password": credentials["password"],
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    tokens = response.json()
    assert tokens["access_token"]
    assert tokens["refresh_token"]


@pytest.mark.asyncio
async def test_login_bad_password(client, faker):
    credentials = {
        "email": faker.unique.email(),
        "username": faker.unique.user_name(),
        "password": "Str0ngPass!",
    }
    await client.post("/api/v1/auth/register", json=credentials)

    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email_or_username": credentials["email"],
            "password": "WrongPass",
        },
    )
    assert response.status_code == 401
    assert_error(response, "http_error")


@pytest.mark.asyncio
async def test_logout_requires_valid_token(client, faker):
    payload = {
        "email": faker.unique.email(),
        "username": faker.unique.user_name(),
        "password": "Str0ngPass!",
    }
    register = await client.post("/api/v1/auth/register", json=payload)
    token = register.json()["access_token"]

    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
