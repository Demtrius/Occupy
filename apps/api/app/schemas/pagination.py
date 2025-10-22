from __future__ import annotations

from typing import Any

from app.schemas.base import BaseSchema


class CursorPage[T](BaseSchema):
    items: list[T]
    next_cursor: str | None = None
    meta: dict[str, Any] | None = None
