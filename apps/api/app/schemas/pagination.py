from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CursorPage[T](BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    items: list[T]
    next_cursor: str | None = Field(default=None, alias="nextCursor")
    meta: dict[str, Any] | None = None
