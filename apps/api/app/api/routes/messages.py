from typing import List
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...api.openapi_helpers import error_responses, secured
from ...core.errors import NotFound
from ...models.user import User
from ...schemas.chat import Message as MessageSchema
from ...schemas.chat import MessageCreate
from ...services.chats import get_chat_by_id
from ...services.messages import delete_message, get_chat_messages, send_message

router = APIRouter(prefix="/api/v1/messages", tags=["Messaging"])


@router.get(
    "/{chat_id}",
    summary="List chat messages",
    description="Return the latest messages in a chat the user participates in.",
    response_model=List[MessageSchema],
    responses={
        200: {"description": "Messages list"},
        **error_responses(401, 404),
    },
    openapi_extra=secured(),
)
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
    if not chat or (
        chat.business_user_id != current_user.id
        and chat.client_user_id != current_user.id
    ):
        raise NotFound("Chat not found")
    return await get_chat_messages(db, chat_id, limit, offset)


@router.post(
    "/{chat_id}",
    summary="Send message",
    description="Send a message in a chat between a client and a business.",
    response_model=MessageSchema,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Message sent"},
        **error_responses(401, 404, 422),
    },
    openapi_extra=secured(),
)
async def create_message(
    chat_id: UUID,
    message: MessageCreate = Body(
        ...,
        examples={
            "text": {
                "summary": "Simple message",
                "value": {"content": "Looking forward to our session tomorrow!"},
            }
        },
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """Send a message in a chat."""
    # Check if user has access to chat
    chat = await get_chat_by_id(db, chat_id)
    if not chat or (
        chat.business_user_id != current_user.id
        and chat.client_user_id != current_user.id
    ):
        raise NotFound("Chat not found")
    return await send_message(db, chat_id, current_user.id, message)


@router.delete(
    "/{message_id}",
    summary="Delete message",
    description="Delete a message sent by the current user.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "Message deleted",
            "content": {
                "application/json": {"example": {"message": "Message deleted"}}
            },
        },
        **error_responses(401, 404),
    },
    openapi_extra=secured(),
)
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
