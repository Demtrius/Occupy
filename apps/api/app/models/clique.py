import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base, TimestampMixin
from .enums import MembershipStatus, Privacy, Role

if TYPE_CHECKING:
    from .availability import Availability
    from .booking import Booking
    from .post import Post
    from .service import Service
    from .user import Occupation, User


class Clique(TimestampMixin, Base):
    __tablename__ = "cliques"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    owner_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    image_url: Mapped[Optional[str]] = mapped_column(String)
    privacy: Mapped[Privacy] = mapped_column(Enum(Privacy, name="privacy"), default=Privacy.PUBLIC)
    timezone: Mapped[str] = mapped_column(String, nullable=False)
    cancellation_cutoff_hours: Mapped[int] = mapped_column(Integer, default=24)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="owned_cliques")
    occupations: Mapped[list["Occupation"]] = relationship(
        "Occupation", secondary="clique_occupations", back_populates="cliques"
    )
    members: Mapped[list["CliqueMember"]] = relationship(
        "CliqueMember", back_populates="clique"
    )
    invites: Mapped[list["CliqueInvite"]] = relationship(
        "CliqueInvite", back_populates="clique"
    )
    posts: Mapped[list["Post"]] = relationship("Post", back_populates="clique")
    services: Mapped[list["Service"]] = relationship("Service", back_populates="clique")
    availabilities: Mapped[list["Availability"]] = relationship(
        "Availability", back_populates="clique"
    )
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="clique")


class CliqueMember(Base):
    __tablename__ = "clique_members"

    clique_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cliques.id"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    role: Mapped[Role] = mapped_column(Enum(Role, name="role"), default=Role.MEMBER)
    status: Mapped[MembershipStatus] = mapped_column(
        Enum(MembershipStatus, name="membership_status"), default=MembershipStatus.JOINED
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    clique: Mapped["Clique"] = relationship("Clique", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="clique_memberships")


class CliqueInvite(Base):
    __tablename__ = "clique_invites"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    clique_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cliques.id")
    )
    token: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    expires_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True))
    max_uses: Mapped[Optional[int]] = mapped_column(Integer)
    uses: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    clique: Mapped["Clique"] = relationship("Clique", back_populates="invites")
