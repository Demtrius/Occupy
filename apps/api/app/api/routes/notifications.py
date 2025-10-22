from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...api.openapi_helpers import error_responses, secured
from ...core.errors import NotFound
from ...models.user import User
from ...schemas.notification import Notification as NotificationSchema
from ...services.notifications import (
    get_user_notifications,
    mark_all_notifications_as_read,
    mark_notification_as_read,
)

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


@router.get(
    "",
    summary="List notifications",
    description="Return notifications for the current user ordered by recency.",
    response_model=List[NotificationSchema],
    responses={
        200: {"description": "Notifications list"},
        **error_responses(401),
    },
    openapi_extra=secured(),
)
async def list_notifications(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    return await get_user_notifications(db, current_user.id, limit, offset)


@router.put(
    "/{notificationId}/read",
    summary="Mark notification read",
    description="Mark a single notification as read and return the updated record.",
    response_model=NotificationSchema,
    responses={
        200: {"description": "Notification updated"},
        **error_responses(401, 404),
    },
    openapi_extra=secured(),
)
async def mark_notification_read(
    notificationId: Annotated[UUID, Path(alias="notificationId")],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    notification = await mark_notification_as_read(db, notificationId, current_user.id)
    if not notification:
        raise NotFound("Notification not found")
    return notification


@router.put(
    "/read-all",
    summary="Mark all notifications read",
    description="Mark every unread notification for the current user as read.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "All notifications marked read",
            "content": {
                "application/json": {
                    "example": {"message": "Marked 12 notifications as read"}
                }
            },
        },
        **error_responses(401),
    },
    openapi_extra=secured(),
)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    count = await mark_all_notifications_as_read(db, current_user.id)
    return {"message": f"Marked {count} notifications as read"}
