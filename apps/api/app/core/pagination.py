from __future__ import annotations

import base64
from datetime import datetime
from typing import Protocol, Sequence, TypeVar
from uuid import UUID

from sqlalchemy import Select, and_, or_

T = TypeVar("T", bound="CursorEntity")


class CursorEntity(Protocol):
    id: UUID
    created_at: datetime


def encode_datetime_cursor(created_at: datetime, entity_id: UUID) -> str:
    payload = f"{created_at.isoformat()}|{entity_id}"
    return base64.urlsafe_b64encode(payload.encode()).decode()


def decode_datetime_cursor(cursor: str) -> tuple[datetime, UUID]:
    try:
        decoded = base64.urlsafe_b64decode(cursor).decode()
        created_str, id_str = decoded.split("|", 1)
        created_at = datetime.fromisoformat(created_str)
        entity_id = UUID(id_str)
        return created_at, entity_id
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Invalid cursor") from exc


def apply_datetime_cursor(
    stmt: Select,
    model,
    cursor: str | None,
    limit: int,
    *,
    descending: bool = True,
) -> Select:
    if descending:
        stmt = stmt.order_by(model.created_at.desc(), model.id.desc())
    else:
        stmt = stmt.order_by(model.created_at.asc(), model.id.asc())
    if cursor:
        created_at, entity_id = decode_datetime_cursor(cursor)
        if descending:
            stmt = stmt.where(
                or_(
                    model.created_at < created_at,
                    and_(
                        model.created_at == created_at,
                        model.id < entity_id,
                    ),
                )
            )
        else:
            stmt = stmt.where(
                or_(
                    model.created_at > created_at,
                    and_(
                        model.created_at == created_at,
                        model.id > entity_id,
                    ),
                )
            )
    return stmt.limit(limit + 1)


def slice_results(rows: Sequence[T], limit: int) -> tuple[list[T], str | None]:
    if not rows:
        return [], None
    has_more = len(rows) > limit
    items = list(rows[:limit])
    if not has_more:
        return items, None
    last = items[-1]
    return items, encode_datetime_cursor(last.created_at, last.id)
