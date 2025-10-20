from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...core.errors import NotFound
from ...models.user import User
from ...schemas.chat import Message as MessageSchema
from ...schemas.chat import MessageCreate
from ...services.chats import get_chat_by_id
from ...services.messages import delete_message, get_chat_messages, send_message

router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/{chat_id}", response_model=List[MessageSchema])
async def list_messages(
    chat_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """List messages in a chat."""
    # Check if user has access to chat
    chat = await get_chat_by_id(db, chat_id)
    if not chat or (chat.business_user_id != current_user.id and chat.client_user_id != current_user.id):
        raise NotFound("Chat not found")
    return await get_chat_messages(db, chat_id, limit, offset)


@router.post("/{chat_id}", response_model=MessageSchema)
async def create_message(
    chat_id: UUID,
    message: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """Send a message in a chat."""
    # Check if user has access to chat
    chat = await get_chat_by_id(db, chat_id)
    if not chat or (chat.business_user_id != current_user.id and chat.client_user_id != current_user.id):
        raise NotFound("Chat not found")
    return await send_message(db, chat_id, current_user.id, message)


@router.delete("/{message_id}")
async def remove_message(
    message_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """Delete a message (only by sender)."""
    success = await delete_message(db, message_id, current_user.id)
    if not success:
        raise NotFound("Message not found or not authorized")
    return {"message": "Message deleted"}