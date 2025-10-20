from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...core.errors import NotFound
from ...models.user import User
from ...schemas.notification import Notification as NotificationSchema
from ...services.notifications import (
    get_user_notifications,
    mark_all_notifications_as_read,
    mark_notification_as_read,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=List[NotificationSchema])
async def list_notifications(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """List notifications for the current user."""
    return await get_user_notifications(db, current_user.id, limit, offset)


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """Mark a specific notification as read."""
    success = await mark_notification_as_read(db, notification_id, current_user.id)
    if not success:
        raise NotFound("Notification not found")
    return {"message": "Notification marked as read"}


@router.put("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """Mark all notifications as read."""
    count = await mark_all_notifications_as_read(db, current_user.id)
    return {"message": f"Marked {count} notifications as read"}