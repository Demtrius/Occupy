from typing import Optional

from app.schemas.base import BaseSchema


class MediaCreate(BaseSchema):
    url: str
    mime: Optional[str] = None
    size_bytes: Optional[int] = None
    meta: Optional[dict] = None


class Media(BaseSchema):
    id: str
    owner_user_id: str
    url: str
    mime: Optional[str] = None
    size_bytes: Optional[int] = None
    meta: Optional[dict] = None
