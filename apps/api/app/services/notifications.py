from typing import List
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.notification import Notification
from ..schemas.notification import Notification as NotificationSchema


async def get_user_notifications(
    db: AsyncSession, user_id: UUID, limit: int = 50, offset: int = 0
) -> List[NotificationSchema]:
    """Get paginated notifications for a user."""
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    notifications = result.scalars().all()
    return [NotificationSchema.model_validate(n) for n in notifications]


async def mark_notification_as_read(
    db: AsyncSession, notification_id: UUID, user_id: UUID
) -> bool:
    """Mark a specific notification as read for the user."""
    stmt = select(Notification).where(
        Notification.id == notification_id, Notification.user_id == user_id
    )
    result = await db.execute(stmt)
    notification = result.scalar_one_or_none()
    if not notification:
        return False
    notification.is_read = True
    notification.read_at = func.now()  # Assuming func is imported
    await db.commit()
    return True


async def mark_all_notifications_as_read(db: AsyncSession, user_id: UUID) -> int:
    """Mark all unread notifications as read for the user. Returns count of updated."""
    stmt = (
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .values(is_read=True, read_at=func.now())
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount