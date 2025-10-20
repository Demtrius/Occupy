import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base
from .enums import FollowStatus

if TYPE_CHECKING:
    from . import (
        Booking,
        Chat,
        Clique,
        CliqueMember,
        Comment,
        Media,
        Message,
        Notification,
        Post,
        PostLike,
        Review,
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String, nullable=False)
    username: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String)
    bio: Mapped[Optional[str]] = mapped_column(Text)
    profile_image_url: Mapped[Optional[str]] = mapped_column(String)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_private_account: Mapped[bool] = mapped_column(Boolean, default=False)
    is_business_page: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    occupations: Mapped[list["Occupation"]] = relationship(
        "Occupation", secondary="user_occupations", back_populates="users"
    )
    following: Mapped[list["Follow"]] = relationship(
        "Follow", foreign_keys="Follow.follower_user_id", back_populates="follower"
    )
    followers: Mapped[list["Follow"]] = relationship(
        "Follow", foreign_keys="Follow.followee_user_id", back_populates="followee"
    )
    owned_cliques: Mapped[list["Clique"]] = relationship(
        "Clique", back_populates="owner"
    )
    clique_memberships: Mapped[list["CliqueMember"]] = relationship(
        "CliqueMember", back_populates="user"
    )
    posts: Mapped[list["Post"]] = relationship("Post", back_populates="author")
    post_likes: Mapped[list["PostLike"]] = relationship(
        "PostLike", back_populates="user"
    )
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="user")
    media: Mapped[list["Media"]] = relationship("Media", back_populates="owner")
    bookings: Mapped[list["Booking"]] = relationship("Booking", back_populates="user")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="rater")
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user"
    )
    business_chats: Mapped[list["Chat"]] = relationship(
        "Chat", foreign_keys="Chat.business_user_id", back_populates="business"
    )
    client_chats: Mapped[list["Chat"]] = relationship(
        "Chat", foreign_keys="Chat.client_user_id", back_populates="client"
    )
    sent_messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="sender"
    )


class Occupation(Base):
    __tablename__ = "occupations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String, nullable=False, unique=True)

    # Relationships
    users: Mapped[list["User"]] = relationship(
        "User", secondary="user_occupations", back_populates="occupations"
    )
    cliques: Mapped[list["Clique"]] = relationship(
        "Clique", secondary="clique_occupations", back_populates="occupations"
    )


class UserOccupation(Base):
    __tablename__ = "user_occupations"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    occupation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("occupations.id"), primary_key=True
    )


class CliqueOccupation(Base):
    __tablename__ = "clique_occupations"

    clique_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cliques.id"), primary_key=True
    )
    occupation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("occupations.id"), primary_key=True
    )


class Follow(Base):
    __tablename__ = "follows"

    follower_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    followee_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True
    )
    status: Mapped[FollowStatus] = mapped_column(
        Enum(FollowStatus), default=FollowStatus.ACCEPTED
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    follower: Mapped["User"] = relationship(
        "User", foreign_keys=[follower_user_id], back_populates="following"
    )
    followee: Mapped["User"] = relationship(
        "User", foreign_keys=[followee_user_id], back_populates="followers"
    )

    __table_args__ = (
        CheckConstraint(
            "follower_user_id <> followee_user_id", name="ck_follows_no_self_follow"
        ),
    )
