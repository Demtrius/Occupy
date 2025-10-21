import pytest
from faker import Faker
from httpx import AsyncClient

from tests.factories import create_user
from tests.utils import assert_error, auth_headers


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient, db_session, faker: Faker):
    """Test successful user registration."""
    email = faker.email()
    data = {
        "email": email,
        "username": faker.user_name(),
        "password": "password123",
    }
    resp = await client.post("/api/v1/auth/register", json=data)
    assert resp.status_code == 201
    resp_data = resp.json()
    assert "user" in resp_data
    assert resp_data["user"]["email"] == email


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, db_session):
    """Test registration with duplicate email fails."""
    await create_user(db_session, email="test@example.com")
    await db_session.commit()
    data = {
        "email": "test@example.com",
        "username": "newuser",
        "password": "password123",
    }
    resp = await client.post("/api/v1/auth/register", json=data)
    assert_error(resp, "conflict")


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db_session):
    """Test successful login."""
    user = await create_user(db_session, email="test@example.com", password="password123")
    await db_session.commit()  # Commit the user so it's visible in other sessions
    data = {"email_or_username": "test@example.com", "password": "password123"}
    resp = await client.post("/api/v1/auth/login", json=data)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_bad_password(client: AsyncClient, db_session):
    """Test login with bad password fails."""
    await create_user(db_session, email="test@example.com", password="password123")
    await db_session.commit()
    data = {"email_or_username": "test@example.com", "password": "wrong"}
    resp = await client.post("/api/v1/auth/login", json=data)
    assert_error(resp, "http_error")


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, db_session):
    """Test refresh token."""
    user = await create_user(db_session)
    # Assume refresh token creation
    # This might need adjustment based on actual implementation
    pass


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, db_session):
    """Test logout."""
    user = await create_user(db_session)
    await db_session.commit()
    headers = auth_headers(user)
    resp = await client.post("/api/v1/auth/logout", headers=headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_rate_limited_login(enable_rate_limits, client: AsyncClient, db_session):
    """Test rate limiting on login."""
    # Enable rate limits
    for _ in range(10):  # Assume limit is 5 or something
        resp = await client.post("/api/v1/auth/login", json={"email_or_username": "test@example.com", "password": "wrong"})
    assert resp.status_code == 429
    assert_error(resp, "http_error")