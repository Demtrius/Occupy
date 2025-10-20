import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base

if TYPE_CHECKING:
    from .booking import Booking
    from .clique import Clique


class Service(Base):
    __tablename__ = "services"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    clique_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cliques.id")
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    price_minor: Mapped[Optional[int]] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(3), default="EUR")
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    buffer_minutes: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    clique: Mapped["Clique"] = relationship("Clique", back_populates="services")
    bookings: Mapped[list["Booking"]] = relationship(
        "Booking", back_populates="service"
    )

    __table_args__ = (
        Index("ix_services_clique_id_is_active", "clique_id", "is_active"),
    )
