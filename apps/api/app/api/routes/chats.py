from typing import List

from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...api.openapi_helpers import error_responses, secured
from ...models.user import User
from ...schemas.chat import Chat as ChatSchema, ChatCreate
from ...services.chats import get_user_chats, create_chat

router = APIRouter(prefix="/api/v1/chats", tags=["Messaging"])


@router.post(
    "",
    operation_id="CreateChat",
    summary="Create chat",
    description="Create a new chat between current user and another user, or return existing chat.",
    response_model=ChatSchema,
    responses={
        200: {"description": "Chat created or retrieved"},
        **error_responses(401),
    },
    openapi_extra=secured(),
)
async def create_new_chat(
    chat_data: ChatCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    # Ensure the current user is part of the chat
    if current_user.id not in [chat_data.business_user_id, chat_data.client_user_id]:
        raise ValueError("You can only create chats where you are a participant")
    
    return await create_chat(db, chat_data)


@router.get(
    "",
    operation_id="Chats",
    summary="List chats",
    description="Return chats the current user participates in, sorted by recent activity.",
    response_model=List[ChatSchema],
    responses={
        200: {"description": "Chats list"},
        **error_responses(401),
    },
    openapi_extra=secured(),
)
async def list_chats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    return await get_user_chats(db, current_user.id)
