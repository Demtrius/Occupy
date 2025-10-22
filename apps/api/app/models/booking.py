import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID, ExcludeConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base, TimestampMixin
from .enums import BookingStatus, CancelledBy

if TYPE_CHECKING:
    from .clique import Clique
    from .review import Review
    from .service import Service
    from .user import User


class Booking(TimestampMixin, Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    clique_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cliques.id")
    )
    service_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("services.id")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    start_ts: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_ts: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status"), default=BookingStatus.PENDING
    )
    cancelled_by: Mapped[Optional[CancelledBy]] = mapped_column(
        Enum(CancelledBy, name="cancelled_by")
    )
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text)
    note: Mapped[Optional[str]] = mapped_column(Text)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(128))

    # Relationships
    clique: Mapped["Clique"] = relationship("Clique", back_populates="bookings")
    service: Mapped["Service"] = relationship("Service", back_populates="bookings")
    user: Mapped["User"] = relationship("User", back_populates="bookings")
    review: Mapped[Optional["Review"]] = relationship(
        "Review", back_populates="booking"
    )

    __table_args__ = (
        CheckConstraint("end_ts > start_ts", name="ck_bookings_end_after_start"),
        Index("ix_bookings_clique_id_start_ts", "clique_id", "start_ts"),
        Index("ix_bookings_user_id_start_ts", "user_id", "start_ts"),
        Index("ix_bookings_service_id_start_ts", "service_id", "start_ts"),
        UniqueConstraint(
            "user_id", "idempotency_key", name="uq_bookings_user_idempotency"
        ),
        ExcludeConstraint(
            ("clique_id", "="),
            (text("tstzrange(start_ts, end_ts, '[]')"), "&&"),
            where=text("status IN ('PENDING','CONFIRMED')"),
            name="bookings_no_overlap",
            using="gist",
        ),
    )
