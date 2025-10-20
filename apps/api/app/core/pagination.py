import base64
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import Select, desc


def encode_cursor(sort_value: datetime | int | str, id: UUID) -> str:
    cursor_data = f"{int(sort_value.timestamp()) if isinstance(sort_value, datetime) else sort_value}:{id}"
    return base64.b64encode(cursor_data.encode()).decode()


def decode_cursor(cursor: str) -> tuple[Any, UUID]:
    try:
        decoded = base64.b64decode(cursor).decode()
        sort_str, id_str = decoded.split(":", 1)
        sort_value = sort_str  # keep as str, or parse based on type
        return sort_value, UUID(id_str)
    except Exception:
        raise ValueError("Invalid cursor")


async def apply_cursor(
    query: Select,
    cursor: str | None,
    limit: int,
    sort_columns: tuple[str, str] = ("created_at", "id"),
    direction: str = "desc"
) -> Select:
    if cursor:
        sort_value, id_value = decode_cursor(cursor)
        sort_col, id_col = sort_columns
        if direction == "desc":
            query = query.where(
                (getattr(query, sort_col) < sort_value) |
                ((getattr(query, sort_col) == sort_value) & (getattr(query, id_col) < id_value))
            )
        else:
            query = query.where(
                (getattr(query, sort_col) > sort_value) |
                ((getattr(query, sort_col) == sort_value) & (getattr(query, id_col) > id_value))
            )
    if direction == "desc":
        query = query.order_by(desc(getattr(query, sort_columns[0])), desc(getattr(query, sort_columns[1])))
    else:
        query = query.order_by(getattr(query, sort_columns[0]), getattr(query, sort_columns[1]))
    return query.limit(limit + 1)  # +1 to check if there's next