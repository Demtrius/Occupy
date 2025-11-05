import uuid
from typing import Optional

from sqlalchemy import Boolean, Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from ..db.base import Base, TimestampMixin
from .enums import FeedbackType


class Feedback(TimestampMixin, Base):
    __tablename__ = "feedback"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    feedback_type: Mapped[FeedbackType] = mapped_column(
        Enum(FeedbackType, name="feedback_type"),
        default=FeedbackType.GENERAL_FEEDBACK,
        nullable=False,
    )
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)

    def __str__(self) -> str:
        return f"{self.name} - {self.feedback_type.value} - {self.created_at.strftime('%Y-%m-%d')}"
