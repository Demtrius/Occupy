from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from app.schemas.base import BaseSchema


class ChatBase(BaseSchema):
    business_user_id: UUID
    client_user_id: UUID


class ChatCreate(ChatBase):
    pass


class Chat(ChatBase):
    id: UUID
    created_at: datetime


class MediaInfo(BaseSchema):
    id: UUID
    url: str
    mime: Optional[str] = None
    size_bytes: Optional[int] = None
    meta: Optional[dict[str, Any]] = None


class MessageBase(BaseSchema):
    body: Optional[str] = None
    media_id: Optional[UUID] = None


class MessageCreate(MessageBase):
    pass


class Message(MessageBase):
    id: UUID
    chat_id: UUID
    sender_user_id: UUID
    sent_at: datetime
    read_at: Optional[datetime] = None
    media: Optional[MediaInfo] = None
