from __future__ import annotations

import os
from typing import Optional

from redis.asyncio import Redis

_client: Optional[Redis] = None


def get_redis_url() -> str:
    url = os.environ.get("REDIS_URL")
    if not url:
        raise RuntimeError("REDIS_URL is not configured")
    return url


def set_redis_client(client: Redis) -> None:
    global _client
    _client = client


def get_redis_client() -> Redis:
    global _client
    if _client is None:
        url = get_redis_url()
        _client = Redis.from_url(
            url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _client
