from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.chat import Chat
from ..schemas.chat import Chat as ChatSchema
from ..schemas.chat import ChatCreate


async def create_chat(db: AsyncSession, chat_data: ChatCreate) -> ChatSchema:
    """Create a new chat between business and client, or return existing."""
    # Check if chat already exists
    stmt = select(Chat).where(
        Chat.business_user_id == chat_data.business_user_id,
        Chat.client_user_id == chat_data.client_user_id,
    )
    result = await db.execute(stmt)
    existing_chat = result.scalar_one_or_none()
    if existing_chat:
        return ChatSchema.model_validate(existing_chat)

    # Create new chat
    chat = Chat(**chat_data.model_dump())
    db.add(chat)
    await db.commit()
    await db.refresh(chat)
    return ChatSchema.model_validate(chat)


async def get_user_chats(db: AsyncSession, user_id: UUID) -> List[ChatSchema]:
    """Get all chats for a user (as business or client)."""
    stmt = select(Chat).where(
        (Chat.business_user_id == user_id) | (Chat.client_user_id == user_id)
    )
    result = await db.execute(stmt)
    chats = result.scalars().all()
    return [ChatSchema.model_validate(c) for c in chats]


async def get_chat_by_id(db: AsyncSession, chat_id: UUID) -> Chat | None:
    """Get a chat by ID."""
    stmt = select(Chat).where(Chat.id == chat_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()