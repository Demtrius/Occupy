from __future__ import annotations

from redis.exceptions import RedisError

from .redis import get_redis_client, set_redis_client

IDEMPOTENCY_PREFIX = "idempotency"


def use_redis_client(client) -> None:
    """Allow tests to inject a dedicated Redis client."""
    set_redis_client(client)


async def ensure_idempotency(
    key: str,
    scope: str,
    payload_hash: str,
    ttl_hours: int = 24,
) -> str | None:
    """
    Ensure the given idempotency key is unique within the scope.

    Returns the previously stored payload hash if the key already exists, otherwise
    stores the provided payload hash and returns ``None``.
    """
    client = get_redis_client()
    redis_key = f"{IDEMPOTENCY_PREFIX}:{scope}:{key}"
    try:
        existing = await client.get(redis_key)
        if existing is not None:
            return existing

        ttl_seconds = max(int(ttl_hours * 3600), 1)
        was_set = await client.set(redis_key, payload_hash, ex=ttl_seconds, nx=True)
        if was_set:
            return None
        # Another request set it after our first read; fetch the stored value.
        return await client.get(redis_key)
    except RedisError as exc:  # pragma: no cover - defensive logging hook
        raise RuntimeError("Idempotency store unavailable") from exc
