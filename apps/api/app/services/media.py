from __future__ import annotations

import os
from datetime import datetime, timedelta
from typing import Any
from urllib.parse import urlparse
from uuid import uuid4

from minio import Minio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.errors import Validation
from ..core.pagination import apply_datetime_cursor, slice_results
from ..models.media import Media

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 10_000_000


def _validate_media(mime: str | None, size_bytes: int | None) -> None:
    if not mime or mime not in ALLOWED_MIME:
        raise Validation("Unsupported mime or size")
    if size_bytes is None or size_bytes <= 0 or size_bytes > MAX_SIZE:
        raise Validation("Unsupported mime or size")


async def register_media(
    db: AsyncSession,
    owner_user_id: str,
    url: str,
    mime: str | None,
    size_bytes: int | None,
    meta: dict | None,
) -> Media:
    _validate_media(mime, size_bytes)

    media = Media(
        owner_user_id=owner_user_id,
        url=url,
        mime=mime,
        size_bytes=size_bytes,
        meta=meta,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return media


async def get_media_by_id(db: AsyncSession, media_id: str) -> Media | None:
    return await db.get(Media, media_id)


async def get_user_media(
    db: AsyncSession, user_id: str, cursor: str | None, limit: int
) -> tuple[list[Media], str | None]:
    stmt = select(Media).where(Media.owner_user_id == user_id)
    stmt = apply_datetime_cursor(stmt, Media, cursor, limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return slice_results(rows, limit)


def generate_presigned_upload(
    purpose: str, mime: str, size_bytes: int
) -> dict[str, Any]:
    _validate_media(mime, size_bytes)

    sanitized_purpose = _sanitize_purpose(purpose)
    client, bucket, base_path = _get_minio_client()
    object_name = f"{base_path}{sanitized_purpose}/{uuid4().hex}"
    expires = timedelta(hours=1)
    upload_url = client.presigned_put_object(bucket, object_name, expires=expires)
    return {
        "upload_url": upload_url,
        "expires_in": int(expires.total_seconds()),
    }


def _get_minio_client() -> tuple[Minio, str, str]:
    endpoint = os.environ.get("MINIO_ENDPOINT")
    access_key = os.environ.get("MINIO_ACCESS_KEY")
    secret_key = os.environ.get("MINIO_SECRET_KEY")
    bucket = os.environ.get("MINIO_BUCKET")
    if not all([endpoint, access_key, secret_key, bucket]):
        raise ValueError("MinIO configuration is incomplete")

    parsed = urlparse(endpoint)
    if parsed.scheme in ("http", "https"):
        secure = parsed.scheme == "https"
        netloc = parsed.netloc
        base_path = parsed.path.strip("/")
    else:
        # No valid scheme, treat endpoint as host:port
        secure = False
        netloc = endpoint
        base_path = ""
    base_prefix = f"{base_path}/" if base_path else ""
    client = Minio(
        netloc,
        access_key=access_key,
        secret_key=secret_key,
        secure=secure,
    )
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
    return client, bucket, base_prefix


def _sanitize_purpose(purpose: str) -> str:
    token = purpose.strip().lower() or "misc"
    cleaned = "".join(ch for ch in token if ch.isalnum() or ch in {"-", "_"})
    return cleaned or "misc"
