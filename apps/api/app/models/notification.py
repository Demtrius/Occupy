import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base
from .enums import NotificationType

if TYPE_CHECKING:
    from .user import User


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notification_type"), nullable=False
    )
    payload: Mapped[JSON] = mapped_column(JSON, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")

    __table_args__ = (Index("ix_notifications_user_id_is_read", "user_id", "is_read"),)
