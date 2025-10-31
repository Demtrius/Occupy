from datetime import datetime, timezone, timedelta
from typing import List
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from ..api.ws import manager
from ..core.errors import Forbidden, NotFound
from ..models.chat import Chat, Message
from ..models.media import Media
from ..schemas.chat import Message as MessageSchema
from ..schemas.chat import MessageCreate

# Type alias for clarity
MessageDateTime = datetime


async def send_message(
    db: AsyncSession, chat_id: UUID, sender_id: UUID, message_data: MessageCreate
) -> MessageSchema:
    """Send a message in a chat."""
    message = Message(
        chat_id=chat_id,
        sender_user_id=sender_id,
        sent_at=datetime.now(timezone.utc),
        **message_data.model_dump(),
    )
    db.add(message)
    await db.commit()
    
    # Load media relationship if media_id exists
    if message.media_id:
        await db.refresh(message, ["media"])
    
    # Build message schema with media info
    message_dict = {
        "id": message.id,
        "chat_id": message.chat_id,
        "sender_user_id": message.sender_user_id,
        "body": message.body,
        "media_id": message.media_id,
        "sent_at": message.sent_at,
        "read_at": message.read_at,
    }
    
    # Add media information if available
    if message.media:
        message_dict["media"] = {  # type: ignore
            "id": message.media.id,
            "url": message.media.url,
            "mime": message.media.mime,
            "size_bytes": message.media.size_bytes,
            "meta": message.media.meta,
        }
    
    message_schema = MessageSchema.model_validate(message_dict)
    
    # Broadcast
    await manager.broadcast(str(chat_id), {
        "type": "message.created",
        "message": {
            "id": str(message_schema.id),
            "chat_id": str(message_schema.chat_id),
            "sender_user_id": str(message_schema.sender_user_id),
            "body": message_schema.body,
            "media_id": str(message_schema.media_id) if message_schema.media_id else None,
            "media": {
                "id": message_schema.media.id,
                "url": message_schema.media.url,
                "mime": message_schema.media.mime,
                "size_bytes": message_schema.media.size_bytes,
                "meta": message_schema.media.meta,
            } if message_schema.media else None,
            "sent_at": message_schema.sent_at.isoformat() if message_schema.sent_at else None,
        },
    })
    # Also broadcast chat update to user rooms
    chat = await db.get(Chat, chat_id)
    if chat:
        await manager.broadcast(f"user_{chat.business_user_id}", {
            "type": "chat.updated",
            "chat_id": str(chat_id),
        })
        await manager.broadcast(f"user_{chat.client_user_id}", {
            "type": "chat.updated",
            "chat_id": str(chat_id),
        })
    return message_schema


async def get_chat_messages(
    db: AsyncSession, chat_id: UUID, limit: int = 50, offset: int = 0
) -> List[MessageSchema]:
    """Get messages for a chat."""
    stmt = (
        select(Message)
        .options(joinedload(Message.media))
        .where(Message.chat_id == chat_id)
        .order_by(Message.sent_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    message_schemas = []
    for m in messages:
        message_dict = {
            "id": m.id,
            "chat_id": m.chat_id,
            "sender_user_id": m.sender_user_id,
            "body": m.body,
            "media_id": m.media_id,
            "sent_at": m.sent_at,
            "read_at": m.read_at,
        }
        
        # Add media information if available
        if m.media:
            message_dict["media"] = {  # type: ignore
                "id": m.media.id,
                "url": m.media.url,
                "mime": m.media.mime,
                "size_bytes": m.media.size_bytes,
                "meta": m.media.meta,
            }
        
        message_schemas.append(MessageSchema.model_validate(message_dict))
    
    return message_schemas


async def delete_message(db: AsyncSession, message_id: UUID, user_id: UUID) -> bool:
    """Delete a message if the user is sender and within the retention window."""
    stmt = select(Message).where(Message.id == message_id)
    result = await db.execute(stmt)
    message = result.scalar_one_or_none()
    if not message:
        return False
    if message.sender_user_id != user_id:
        raise Forbidden(message="Only the sender can delete this message")
    sent_at = message.sent_at
    if sent_at is not None:
        # Enforce a 15 minute deletion window.
        now = datetime.now(timezone.utc)
        # Message.sent_at should already be timezone-aware datetime
        # Type ignore due to SQLAlchemy DateTime type annotation issues
        if now > sent_at + timedelta(minutes=15):  # type: ignore
            raise Forbidden(
                message="Message can no longer be deleted",
                details={"retention_minutes": 15},
            )
    await db.delete(message)
    await db.commit()
    # Broadcast the message deletion
    await manager.broadcast(str(message.chat_id), {
        "type": "message.deleted",
        "message_id": str(message_id),
    })
    return True


async def mark_messages_as_read(db: AsyncSession, chat_id: UUID, user_id: UUID) -> int:
    """Mark all unread messages in a chat as read for the user (not sender)."""
    # Check if user has access to chat
    stmt = select(Chat).where(Chat.id == chat_id)
    result = await db.execute(stmt)
    chat = result.scalar_one_or_none()
    if not chat or user_id not in {chat.business_user_id, chat.client_user_id}:
        raise NotFound("Chat not found")

    # Update messages where sender is not the user and read_at is null
    stmt = (
        update(Message)
        .where(
            Message.chat_id == chat_id,
            Message.sender_user_id != user_id,
            Message.read_at.is_(None),
        )
        .values(read_at=datetime.now(timezone.utc))
    )
    result = await db.execute(stmt)
    await db.commit()
    # Broadcast that messages were read
    await manager.broadcast(str(chat_id), {
        "type": "messages.read",
        "user_id": str(user_id),
    })
    return result.rowcount  # type: ignore
