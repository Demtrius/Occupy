from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.chat import Message
from ..schemas.chat import Message as MessageSchema
from ..schemas.chat import MessageCreate


async def send_message(
    db: AsyncSession, chat_id: UUID, sender_id: UUID, message_data: MessageCreate
) -> MessageSchema:
    """Send a message in a chat."""
    message = Message(
        chat_id=chat_id,
        sender_user_id=sender_id,
        **message_data.model_dump()
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return MessageSchema.model_validate(message)


async def get_chat_messages(
    db: AsyncSession, chat_id: UUID, limit: int = 50, offset: int = 0
) -> List[MessageSchema]:
    """Get messages for a chat."""
    stmt = (
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.sent_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()
    return [MessageSchema.model_validate(m) for m in messages]


async def delete_message(
    db: AsyncSession, message_id: UUID, user_id: UUID
) -> bool:
    """Delete a message if the user is the sender."""
    stmt = select(Message).where(
        Message.id == message_id, Message.sender_user_id == user_id
    )
    result = await db.execute(stmt)
    message = result.scalar_one_or_none()
    if not message:
        return False
    await db.delete(message)
    await db.commit()
    return True