import asyncio
import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from faker import Faker
from freezegun import freeze_time
from httpx import ASGITransport, AsyncClient
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from testcontainers.minio import MinioContainer
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer

from app.core.auth import create_access_token, create_refresh_token
from app.db.base import Base

DRIVER = "postgresql+asyncpg"


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def postgres_container():
    """Start PostgreSQL container."""
    with PostgresContainer("postgres:16").with_env(
        "POSTGRES_HOST_AUTH_METHOD", "trust"
    ) as postgres:
        yield postgres


def _async_url_from_container(pg: PostgresContainer) -> str:
    sync_url = pg.get_connection_url()
    url = make_url(sync_url).set(drivername=DRIVER)
    return str(url)


@pytest.fixture(scope="session")
def database_url(postgres_container: PostgresContainer):
    """Get the database URL for tests."""
    yield _async_url_from_container(postgres_container)


@pytest.fixture(scope="session")
def redis_container():
    """Start Redis container."""
    with RedisContainer("redis:7") as redis:
        yield redis


@pytest.fixture(scope="session")
def minio_container():
    """Start MinIO container."""

    with MinioContainer("minio/minio") as minio:
        yield minio


@pytest_asyncio.fixture(scope="function")
async def engine(database_url):
    """Create async engine for tests."""
    engine = create_async_engine(database_url, future=True, pool_pre_ping=False)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def async_session_maker(engine):
    """Create async session maker."""
    return async_sessionmaker(engine, expire_on_commit=False)


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_database(engine, database_url):
    """Set up the database schema."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)  # Clean slate
        await conn.run_sync(Base.metadata.create_all)


@pytest_asyncio.fixture
async def db_session(async_session_maker) -> AsyncGenerator[AsyncSession, None]:
    """Provide a database session with transaction rollback."""
    async with async_session_maker() as session:
        async with session.begin():
            yield session
            await session.rollback()  # Rollback after test


@pytest_asyncio.fixture
async def client(
    database_url, redis_container, minio_container, async_session_maker
) -> AsyncGenerator[AsyncClient, None]:
    """Provide an HTTP client for testing the FastAPI app."""
    # Set environment variables
    os.environ["DATABASE_URL"] = database_url
    os.environ["REDIS_URL"] = (
        f"redis://{redis_container.get_container_host_ip()}:{redis_container.get_exposed_port(6379)}"
    )
    os.environ["MINIO_ENDPOINT"] = (
        f"http://{minio_container.get_container_host_ip()}:{minio_container.get_exposed_port(9000)}"
    )
    os.environ["MINIO_ACCESS_KEY"] = "minioadmin"
    os.environ["MINIO_SECRET_KEY"] = "minioadmin"
    os.environ["MINIO_BUCKET"] = "test-bucket"
    os.environ["MINIO_USE_SSL"] = "false"
    os.environ["JWT_SECRET"] = "test-secret"

    # Override app's sessionmaker
    from app.core import auth

    auth.sessionmaker = async_session_maker

    from app.api import deps

    deps.sessionmaker = auth.sessionmaker

    from app.main import app

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@pytest.fixture
def disable_rate_limits():
    """Fixture to disable rate limiting (default)."""
    from app.core.limiter import limiter

    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture
def enable_rate_limits(disable_rate_limits):
    """Fixture to enable rate limiting."""
    from app.core.limiter import limiter

    limiter.enabled = True
    yield
    limiter.enabled = False


@pytest.fixture
def make_token():
    """Helper to create JWT tokens for users."""

    def _make_token(user, *, is_refresh=False):
        data = {"sub": str(user.id)}
        if is_refresh:
            return create_refresh_token(data)
        else:
            return create_access_token(data)

    return _make_token


@pytest.fixture
def faker():
    """Provide a Faker instance."""
    return Faker()


@pytest.fixture
def time_machine():
    """Provide time control."""
    with freeze_time() as frozen:
        yield frozen
