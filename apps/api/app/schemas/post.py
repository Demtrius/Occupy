from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseSchema

from ..models.enums import ContentFormat, PostStatus
from .media import Media


class PostAuthorSummary(BaseSchema):
    id: UUID
    username: str
    full_name: str
    profile_image_url: Optional[str] = None


class PostCliqueSummary(BaseSchema):
    id: UUID
    name: str
    image_url: Optional[str] = None


class PostMediaItem(BaseSchema):
    id: UUID
    media_id: UUID
    position: int = 0
    media: Media


class PostBase(BaseSchema):
    content_format: ContentFormat = ContentFormat.MARKDOWN
    content: str
    status: PostStatus = PostStatus.DRAFT


class PostCreate(PostBase):
    media_ids: list[UUID] = Field(default_factory=list)


class PostUpdate(BaseSchema):
    content: Optional[str] = None
    status: Optional[PostStatus] = None
    media_ids: Optional[list[UUID]] = None


class Post(PostBase):
    id: UUID
    clique_id: UUID
    author_user_id: UUID
    author: Optional[PostAuthorSummary] = None
    clique: Optional[PostCliqueSummary] = None
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    liked_by_me: bool = False
    media: list[PostMediaItem] = Field(default_factory=list)
    comments: list["Comment"] = Field(default_factory=list)


class Comment(BaseSchema):
    id: UUID
    post_id: UUID
    user_id: UUID
    body: str
    parent_comment_id: Optional[UUID] = None
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    author: Optional[PostAuthorSummary] = None


class CommentCreate(BaseSchema):
    body: str
    parent_comment_id: Optional[UUID] = None


Post.model_rebuild()
