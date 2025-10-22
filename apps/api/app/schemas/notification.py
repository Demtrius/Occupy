from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from app.schemas.base import BaseSchema

from ..models.enums import NotificationType


class NotificationBase(BaseSchema):
    type: NotificationType
    payload: Dict[str, Any]
    is_read: bool = False
    read_at: Optional[datetime] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseSchema):
    is_read: Optional[bool] = None


class Notification(NotificationBase):
    id: UUID
    user_id: UUID
    created_at: datetime
