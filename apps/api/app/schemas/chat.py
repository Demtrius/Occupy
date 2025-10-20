from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChatBase(BaseModel):
    business_user_id: UUID
    client_user_id: UUID


class ChatCreate(ChatBase):
    pass


class Chat(ChatBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class MessageBase(BaseModel):
    body: Optional[str] = None
    media_id: Optional[UUID] = None


class MessageCreate(MessageBase):
    pass


class Message(MessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    chat_id: UUID
    sender_user_id: UUID
    sent_at: datetime