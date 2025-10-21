from pydantic import BaseModel
from typing import Optional


class MediaCreate(BaseModel):
    url: str
    mime: Optional[str] = None
    size_bytes: Optional[int] = None
    meta: Optional[dict] = None


class Media(BaseModel):
    id: str
    owner_user_id: str
    url: str
    mime: Optional[str] = None
    size_bytes: Optional[int] = None
    meta: Optional[dict] = None