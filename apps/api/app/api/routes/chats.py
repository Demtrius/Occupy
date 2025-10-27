from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...api.openapi_helpers import error_responses, secured
from ...models.user import User
from ...schemas.chat import Chat as ChatSchema
from ...services.chats import get_user_chats

router = APIRouter(prefix="/api/v1/chats", tags=["Messaging"])


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
