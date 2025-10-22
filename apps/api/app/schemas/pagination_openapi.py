from __future__ import annotations

from typing import Any

from app.schemas.base import BaseSchema

from .booking import Booking
from .clique import CliqueMember
from .post import Post
from .user import Follow, User
from .review import Review


class CursorPageBase(BaseSchema):
    next_cursor: str | None = None
    meta: dict[str, Any] | None = None


class CursorPagePosts(CursorPageBase):
    items: list[Post]


class CursorPageBookings(CursorPageBase):
    items: list[Booking]


class CursorPageCliqueMembers(CursorPageBase):
    items: list[CliqueMember]


class CursorPageUsers(CursorPageBase):
    items: list[User]


class CursorPageFollows(CursorPageBase):
    items: list[Follow]


class CursorPageReviews(CursorPageBase):
    items: list[Review]
