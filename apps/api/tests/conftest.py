import asyncio
import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from alembic.config import Config
from alembic.util.exc import CommandError
from asgi_lifespan import LifespanManager
from faker import Faker
from freezegun import freeze_time
from httpx import ASGITransport, AsyncClient
from minio import Minio
from redis.asyncio import Redis
from redis.exceptions import ConnectionError as RedisConnectionError
from sqlalchemy import make_url, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from testcontainers.minio import MinioContainer
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer

from alembic import command
from app.core import idempotency as idempotency_core
from app.core.auth import create_access_token
from app.core.limiter import limiter
from app.db.base import Base


TABLE_NAMES = [
    table.name
    for table in Base.metadata.sorted_tables
    if table.name != "alembic_version"
]

BASE_DIR = Path(__file__).resolve().parents[1]
ALEMBIC_INI = BASE_DIR / "alembic.ini"
MIGRATIONS_DIR = BASE_DIR / "alembic"


@pytest.fixture(scope="session")
def event_loop() -> AsyncGenerator[asyncio.AbstractEventLoop, None]:
    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        yield loop
    finally:
        asyncio.set_event_loop(None)
        loop.close()


@pytest.fixture(scope="session")
def postgres_container() -> AsyncGenerator[PostgresContainer, None]:
    db_name = f"test_{uuid.uuid4().hex}"
    container = (
        PostgresContainer("postgres:16")
        .with_env("POSTGRES_DB", db_name)
        .with_env("POSTGRES_HOST_AUTH_METHOD", "trust")
    )
    with container as instance:
        yield instance


def _asyncpg_url(container: PostgresContainer) -> str:
    sync_url = container.get_connection_url()
    return str(make_url(sync_url).set(drivername="postgresql+asyncpg"))


@pytest.fixture(scope="session")
def database_url(postgres_container: PostgresContainer) -> str:
    return _asyncpg_url(postgres_container)


@pytest.fixture(scope="session")
def run_migrations(postgres_container: PostgresContainer) -> None:
    cfg = Config(str(ALEMBIC_INI))
    cfg.set_main_option("script_location", str(MIGRATIONS_DIR))
    cfg.set_main_option(
        "sqlalchemy.url",
        str(
            make_url(postgres_container.get_connection_url()).set(
                drivername="postgresql+asyncpg"
            )
        ),
    )
    # asyncio.run(_drop_existing_enums(_asyncpg_url(postgres_container)))
    try:
        command.downgrade(cfg, "base")
    except CommandError:
        pass
    command.upgrade(cfg, "head")


@pytest.fixture(scope="session")
def redis_container() -> AsyncGenerator[RedisContainer, None]:
    with RedisContainer("redis:7") as container:
        yield container


def _redis_connection_url(redis_container: RedisContainer) -> str:
    host = redis_container.get_container_host_ip()
    port = redis_container.get_exposed_port(6379)
    return f"redis://{host}:{port}/0"


async def _wait_for_redis(client: Redis, retries: int = 10, delay: float = 0.5) -> None:
    for attempt in range(retries):
        try:
            await client.ping()
            return
        except (RedisConnectionError, OSError):
            if attempt == retries - 1:
                raise
            await asyncio.sleep(delay)


@pytest_asyncio.fixture
async def redis_client(
    redis_container: RedisContainer,
) -> AsyncGenerator[Redis, None]:
    redis_url = _redis_connection_url(redis_container)
    client = Redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    await _wait_for_redis(client)
    try:
        yield client
    finally:
        await client.aclose()


@dataclass
class MinioSettings:
    endpoint: str
    access_key: str
    secret_key: str
    bucket: str
    secure: bool


@pytest.fixture(scope="session")
def minio_container() -> AsyncGenerator[MinioSettings, None]:
    access_key = "minioadmin"
    secret_key = "minioadmin"
    bucket = "test-bucket"
    container = MinioContainer("minio/minio:RELEASE.2024-08-03T04-33-23Z")
    container = container.with_env("MINIO_ROOT_USER", access_key)
    container = container.with_env("MINIO_ROOT_PASSWORD", secret_key)
    with container as instance:
        host = instance.get_container_host_ip()
        port = instance.get_exposed_port(9000)
        endpoint = f"http://{host}:{port}"
        client = Minio(
            f"{host}:{port}",
            access_key=access_key,
            secret_key=secret_key,
            secure=False,
        )
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
        yield MinioSettings(
            endpoint=endpoint,
            access_key=access_key,
            secret_key=secret_key,
            bucket=bucket,
            secure=False,
        )


@pytest_asyncio.fixture(scope="session")
async def engine(
    database_url: str,
    run_migrations: None,
) -> AsyncGenerator:
    engine = create_async_engine(database_url, poolclass=NullPool)
    try:
        yield engine
    finally:
        await engine.dispose()


@pytest.fixture(scope="session")
def async_session_maker(engine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)


async def _drop_existing_enums(database_url: str) -> None:
    engine = create_async_engine(database_url, poolclass=NullPool)

    enum_query = text(
        """
            SELECT n.nspname AS schema_name, t.typname AS type_name
            FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typtype = 'e'  -- 'e' denotes ENUM types
              AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        """
    )

    async with engine.begin() as conn:
        result = await conn.execute(enum_query)
        rows = result.fetchall()

        if not rows:
            return

        for schema_name, type_name in rows:
            enum_name = f"{schema_name}.{type_name}"
            await conn.execute(text(f"DROP TYPE IF EXISTS {enum_name} CASCADE"))
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(
    async_session_maker: async_sessionmaker[AsyncSession],
    engine,
) -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

    if TABLE_NAMES:
        async with engine.begin() as connection:
            await connection.execute(
                text(f"TRUNCATE {', '.join(TABLE_NAMES)} RESTART IDENTITY CASCADE")
            )


def _configure_environment(
    database_url: str,
    redis_container: RedisContainer,
    minio_settings: MinioSettings,
) -> None:
    redis_url = _redis_connection_url(redis_container)
    os.environ["DATABASE_URL"] = database_url
    os.environ["REDIS_URL"] = redis_url
    os.environ["MINIO_ENDPOINT"] = minio_settings.endpoint
    os.environ["MINIO_ACCESS_KEY"] = minio_settings.access_key
    os.environ["MINIO_SECRET_KEY"] = minio_settings.secret_key
    os.environ["MINIO_BUCKET"] = minio_settings.bucket
    os.environ["MINIO_USE_SSL"] = "false"
    os.environ.setdefault("JWT_SECRET", "test-secret")


@pytest_asyncio.fixture(scope="session")
async def app_fixture(
    engine,
    async_session_maker: async_sessionmaker[AsyncSession],
    database_url: str,
    redis_container: RedisContainer,
    minio_container: MinioSettings,
) -> AsyncGenerator:
    _configure_environment(database_url, redis_container, minio_container)
    from app import main as app_module
    from app.core import auth as auth_core

    app_module.engine = engine
    app_module.async_session = async_session_maker
    app_module.auth_sessionmaker = async_session_maker
    app_module.deps_sessionmaker = async_session_maker
    auth_core.sessionmaker = async_session_maker

    yield app_module.app


@pytest_asyncio.fixture
async def client(app_fixture) -> AsyncGenerator[AsyncClient, None]:
    async with LifespanManager(app_fixture):
        async with AsyncClient(
            transport=ASGITransport(app=app_fixture),
            base_url="http://test",
        ) as http_client:
            yield http_client


@pytest_asyncio.fixture(autouse=True)
async def reset_redis_store(redis_client: Redis):
    idempotency_core.use_redis_client(redis_client)
    await redis_client.flushdb()
    try:
        yield
    finally:
        try:
            await redis_client.flushdb()
        except (RedisConnectionError, RuntimeError):
            # Best-effort cleanup; ignore if Redis is already unavailable or loop closed.
            pass


@pytest.fixture(autouse=True)
def disable_rate_limits():
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture
def enable_rate_limits():
    limiter.enabled = True
    yield
    limiter.enabled = False


@pytest.fixture
def faker() -> Faker:
    return Faker()


@pytest.fixture
def frozen_time():
    with freeze_time() as frozen:
        yield frozen


@pytest.fixture
def make_token():
    def _make_token(user, **claims) -> str:
        payload = {"sub": str(user.id)}
        payload.update(claims)
        return create_access_token(payload)

    return _make_token
