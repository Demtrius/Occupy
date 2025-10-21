from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field
from pydantic.generics import GenericModel

T = TypeVar("T")


class CursorPage(GenericModel, Generic[T]):
    model_config = ConfigDict(populate_by_name=True)

    items: list[T]
    next_cursor: str | None = Field(default=None, alias="nextCursor")
    meta: dict[str, Any] | None = None
