from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...models.user import User
from ...schemas.chat import Chat as ChatSchema
from ...services.chats import get_user_chats

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("/", response_model=List[ChatSchema])
async def list_chats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """List all chats for the current user."""
    return await get_user_chats(db, current_user.id)