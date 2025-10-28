from typing import Any, Dict, Optional

from app.schemas.base import BaseSchema


class MediaCreate(BaseSchema):
    url: str
    mime: Optional[str] = None
    size_bytes: Optional[int] = None
    meta: Optional[Dict[str, Any]] = None


class Media(BaseSchema):
    id: str
    owner_user_id: str
    url: str
    mime: Optional[str] = None
    size_bytes: Optional[int] = None
    meta: Optional[Dict[str, Any]] = None


class MediaPresignResponse(BaseSchema):
    upload_url: str
    expires_in: int


class MediaRegisterResponse(BaseSchema):
    media_id: str
