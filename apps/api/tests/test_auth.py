import pytest

from app.core.auth import verify_password
from app.models.user import User
from tests.utils import assert_error


@pytest.mark.asyncio
async def test_register_creates_user(client, faker, db_session):
    payload = {
        "email": faker.unique.email(),
        "username": faker.unique.user_name(),
        "fullName": faker.name(),
        "password": "Str0ngPass!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "accessToken" in data
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
        "fullName": faker.name(),
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
        "fullName": faker.name(),
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
    assert tokens["accessToken"]
    assert tokens["refreshToken"]


@pytest.mark.asyncio
async def test_login_bad_password(client, faker):
    credentials = {
        "email": faker.unique.email(),
        "username": faker.unique.user_name(),
        "fullName": faker.name(),
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
        "fullName": faker.name(),
        "password": "Str0ngPass!",
    }
    register = await client.post("/api/v1/auth/register", json=payload)
    data = register.json()
    token = data["accessToken"]
    refresh_token = data["refreshToken"]

    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
        json={"refreshToken": refresh_token},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_refresh_rotates_tokens(client, faker):
    payload = {
        "email": faker.unique.email(),
        "username": faker.unique.user_name(),
        "fullName": faker.name(),
        "password": "Str0ngPass!",
    }
    register = await client.post("/api/v1/auth/register", json=payload)
    original = register.json()["refreshToken"]

    refresh = await client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": original},
    )
    assert refresh.status_code == 200
    rotated = refresh.json()["refreshToken"]
    assert rotated != original

    reuse = await client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": original},
    )
    assert reuse.status_code == 401
    assert_error(reuse, "http_error")


@pytest.mark.asyncio
async def test_refresh_requires_valid_token(client):
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": "invalid"},
    )
    assert response.status_code == 401
    assert_error(response, "http_error")


@pytest.mark.asyncio
async def test_logout_rejects_mismatched_user(client, faker):
    owner = await client.post(
        "/api/v1/auth/register",
        json={
            "email": faker.unique.email(),
            "username": faker.unique.user_name(),
            "fullName": faker.name(),
            "password": "Str0ngPass!",
        },
    )
    other = await client.post(
        "/api/v1/auth/register",
        json={
            "email": faker.unique.email(),
            "username": faker.unique.user_name(),
            "fullName": faker.name(),
            "password": "Str0ngPass!",
        },
    )

    logout = await client.post(
        "/api/v1/auth/logout",
        json={"refreshToken": owner.json()["refreshToken"]},
        headers={"Authorization": f"Bearer {other.json()['accessToken']}"},
    )
    assert logout.status_code == 401
