from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
from redis.exceptions import RedisError
from sqlalchemy import Column, DateTime, MetaData, Table, select
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.core import idempotency as idempotency_core
from app.core import pagination as pagination_core
from app.core import redis as redis_core


class StubRedis:
    def __init__(self) -> None:
        self.store: dict[str, str] = {}
        self.set_calls: list[tuple[str, str, int, bool]] = []

    async def get(self, key: str) -> str | None:
        return self.store.get(key)

    async def set(self, key: str, value: str, *, ex: int, nx: bool) -> bool:
        self.set_calls.append((key, value, ex, nx))
        if nx and key in self.store:
            return False
        self.store[key] = value
        return True


class FailingRedis:
    async def get(self, key: str) -> str | None:
        raise RedisError("boom")


@pytest.fixture(autouse=True)
def reset_redis_client():
    # Ensure isolated redis client for each test.
    redis_core._client = None  # type: ignore[attr-defined]
    yield
    redis_core._client = None  # type: ignore[attr-defined]


def test_get_redis_url_requires_env(monkeypatch):
    monkeypatch.delenv("REDIS_URL", raising=False)
    with pytest.raises(RuntimeError):
        redis_core.get_redis_url()


def test_get_redis_client_lazy_initialisation(monkeypatch):
    stub = StubRedis()

    def fake_from_url(url: str, *, encoding: str, decode_responses: bool):
        assert url == "redis://test"
        assert encoding == "utf-8" and decode_responses is True
        return stub

    monkeypatch.setenv("REDIS_URL", "redis://test")
    monkeypatch.setattr(redis_core.Redis, "from_url", fake_from_url)

    client = redis_core.get_redis_client()
    assert client is stub
    # Cached instance reused.
    assert redis_core.get_redis_client() is stub


@pytest.mark.asyncio
async def test_ensure_idempotency_behaviour(monkeypatch):
    stub = StubRedis()
    idempotency_core.use_redis_client(stub)

    # First call stores the hash and returns None.
    result = await idempotency_core.ensure_idempotency("k", "scope", "hash")
    assert result is None
    assert stub.store[f"{idempotency_core.IDEMPOTENCY_PREFIX}:scope:k"] == "hash"

    # Existing key returns stored hash without writing.
    result = await idempotency_core.ensure_idempotency("k", "scope", "hash")
    assert result == "hash"

    # Simulate race condition where set returns False.
    other_key = "race"
    stub.store[f"{idempotency_core.IDEMPOTENCY_PREFIX}:scope:{other_key}"] = "old"
    result = await idempotency_core.ensure_idempotency(other_key, "scope", "new")
    assert result == "old"


@pytest.mark.asyncio
async def test_ensure_idempotency_redis_failure():
    idempotency_core.use_redis_client(FailingRedis())
    with pytest.raises(RuntimeError):
        await idempotency_core.ensure_idempotency("k", "scope", "hash")


def test_pagination_encode_decode_roundtrip():
    now = datetime.now(timezone.utc).replace(microsecond=0)
    entity_id = uuid4()
    cursor = pagination_core.encode_datetime_cursor(now, entity_id)
    decoded_created, decoded_id = pagination_core.decode_datetime_cursor(cursor)
    assert decoded_created == now
    assert decoded_id == entity_id


def test_pagination_decode_invalid():
    with pytest.raises(ValueError):
        pagination_core.decode_datetime_cursor("not-a-cursor")


def test_apply_datetime_cursor_and_slice_results_descending():
    metadata = MetaData()
    table = Table(
        "items",
        metadata,
        Column("id", PG_UUID(as_uuid=True), primary_key=True),
        Column("created_at", DateTime(timezone=True)),
    )

    base_stmt = select(table)
    stmt = pagination_core.apply_datetime_cursor(base_stmt, table.c, None, 5)
    compiled = str(stmt.compile(compile_kwargs={"literal_binds": True}))
    assert "ORDER BY items.created_at DESC" in compiled

    # Provide a cursor and ensure filtering clause appears.
    now = datetime.now(timezone.utc)
    cursor = pagination_core.encode_datetime_cursor(now, uuid4())
    stmt_with_cursor = pagination_core.apply_datetime_cursor(
        base_stmt, table.c, cursor, 5
    )
    compiled_cursor = str(
        stmt_with_cursor.compile(compile_kwargs={"literal_binds": True})
    )
    assert "items.created_at <" in compiled_cursor

    rows = [
        SimpleNamespace(id=uuid4(), created_at=now - timedelta(minutes=i))
        for i in range(3)
    ]
    items, next_cursor = pagination_core.slice_results(rows, limit=2)
    assert len(items) == 2 and next_cursor is not None

    items2, next_cursor2 = pagination_core.slice_results([], limit=2)
    assert items2 == [] and next_cursor2 is None
