from __future__ import annotations

import os
from datetime import timedelta
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
    _, presign_client, bucket, base_path = _get_minio_client()
    object_name = f"{base_path}{sanitized_purpose}/{uuid4().hex}"
    expires = timedelta(hours=1)
    upload_url = presign_client.presigned_put_object(
        bucket, object_name, expires=expires
    )
    final_url = upload_url.split("?", 1)[0]
    return {
        "method": "PUT",
        "upload_url": upload_url,
        "public_url": final_url,
        "expires_in": int(expires.total_seconds()),
    }


def _get_minio_client() -> tuple[Minio, Minio, str, str]:
    endpoint = os.environ.get("MINIO_ENDPOINT")
    access_key = os.environ.get("MINIO_ACCESS_KEY")
    secret_key = os.environ.get("MINIO_SECRET_KEY")
    bucket = os.environ.get("MINIO_BUCKET")
    if not all([endpoint, access_key, secret_key, bucket]):
        raise ValueError("MinIO configuration is incomplete")

    client, base_prefix = _build_minio_client(endpoint, access_key, secret_key)

    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)

    public_endpoint = os.environ.get("MINIO_PUBLIC_ENDPOINT")
    if public_endpoint:
        presign_client, _ = _build_minio_client(public_endpoint, access_key, secret_key)
        # Avoid region lookup against public endpoint which might be unreachable
        try:
            internal_region = client._get_region(bucket)  # type: ignore[attr-defined]
            if hasattr(presign_client, "_region_map"):
                presign_client._region_map[bucket] = internal_region  # type: ignore[attr-defined]
        except Exception:
            pass
    else:
        presign_client = client

    return client, presign_client, bucket, base_prefix


def _build_minio_client(
    endpoint: str, access_key: str, secret_key: str
) -> tuple[Minio, str]:
    parsed = urlparse(endpoint)
    if parsed.scheme in ("http", "https"):
        secure = parsed.scheme == "https"
        netloc = parsed.netloc
        base_path = parsed.path.strip("/")
    else:
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
    return client, base_prefix


def _sanitize_purpose(purpose: str) -> str:
    token = purpose.strip().lower() or "misc"
    cleaned = "".join(ch for ch in token if ch.isalnum() or ch in {"-", "_"})
    return cleaned or "misc"
