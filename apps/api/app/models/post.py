import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db.base import Base
from .enums import ContentFormat, PostStatus

if TYPE_CHECKING:
    from .clique import Clique
    from .media import Media
    from .user import User


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    clique_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cliques.id")
    )
    author_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    status: Mapped[PostStatus] = mapped_column(
        Enum(PostStatus), default=PostStatus.DRAFT
    )
    content_format: Mapped[ContentFormat] = mapped_column(
        Enum(ContentFormat), default=ContentFormat.MARKDOWN
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    deleted_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    clique: Mapped["Clique"] = relationship("Clique", back_populates="posts")
    author: Mapped["User"] = relationship("User", back_populates="posts")
    media: Mapped[list["PostMedia"]] = relationship("PostMedia", back_populates="post")
    likes: Mapped[list["PostLike"]] = relationship("PostLike", back_populates="post")
    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="post")

    __table_args__ = (
        Index("ix_posts_clique_id_created_at", "clique_id", "created_at"),
    )


class PostMedia(Base):
    __tablename__ = "post_media"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE")
    )
    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="RESTRICT")
    )
    position: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    post: Mapped["Post"] = relationship("Post", back_populates="media")
    media: Mapped["Media"] = relationship("Media")

    __table_args__ = (
        UniqueConstraint("post_id", "position", name="uq_post_media_post_id_position"),
    )


class PostLike(Base):
    __tablename__ = "post_likes"

    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    post: Mapped["Post"] = relationship("Post", back_populates="likes")
    user: Mapped["User"] = relationship("User", back_populates="post_likes")

    __table_args__ = (Index("ix_post_likes_user_id", "user_id"),)


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE")
    )
    parent_comment_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE")
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    deleted_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    post: Mapped["Post"] = relationship("Post", back_populates="comments")
    user: Mapped["User"] = relationship("User", back_populates="comments")
    parent: Mapped[Optional["Comment"]] = relationship(
        "Comment", remote_side=[id], backref="replies"
    )

    __table_args__ = (
        CheckConstraint(
            "parent_comment_id IS NULL OR (SELECT c.post_id FROM comments c WHERE c.id = parent_comment_id) = post_id",
            name="ck_comments_parent_same_post",
        ),
        Index("ix_comments_post_id_created_at", "post_id", "created_at"),
    )
