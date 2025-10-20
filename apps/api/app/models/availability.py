import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    SmallInteger,
    String,
    Time,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base

if TYPE_CHECKING:
    from .clique import Clique


class Availability(Base):
    __tablename__ = "availabilities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    clique_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cliques.id")
    )
    is_recurring: Mapped[bool] = mapped_column(Boolean, nullable=False)
    date: Mapped[Optional[Date]] = mapped_column(Date)
    day_of_week: Mapped[Optional[int]] = mapped_column(SmallInteger)
    start_time: Mapped[Time] = mapped_column(Time, nullable=False)
    end_time: Mapped[Time] = mapped_column(Time, nullable=False)
    valid_from: Mapped[Optional[Date]] = mapped_column(Date)
    valid_until: Mapped[Optional[Date]] = mapped_column(Date)
    timezone: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    clique: Mapped["Clique"] = relationship("Clique", back_populates="availabilities")

    __table_args__ = (
        CheckConstraint(
            "day_of_week BETWEEN 0 AND 6", name="ck_availabilities_day_of_week_range"
        ),
        CheckConstraint(
            "end_time > start_time", name="ck_availabilities_end_after_start"
        ),
        CheckConstraint(
            "(is_recurring = true AND date IS NULL AND day_of_week IS NOT NULL) OR "
            "(is_recurring = false AND date IS NOT NULL AND day_of_week IS NULL)",
            name="ck_availabilities_recurring_constraints",
        ),
    )
