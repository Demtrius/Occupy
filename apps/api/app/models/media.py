import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base

if TYPE_CHECKING:
    from .user import User


class Media(Base):
    __tablename__ = "media"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    url: Mapped[str] = mapped_column(String, nullable=False)
    mime: Mapped[Optional[str]] = mapped_column(String)
    size_bytes: Mapped[Optional[int]] = mapped_column(BigInteger)
    meta: Mapped[Optional[JSONB]] = mapped_column(JSONB)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="media")
