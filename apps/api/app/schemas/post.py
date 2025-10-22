from datetime import datetime
from typing import Optional
from uuid import UUID

from app.schemas.base import BaseSchema

from ..models.enums import ContentFormat, PostStatus


class PostBase(BaseSchema):
    content_format: ContentFormat = ContentFormat.MARKDOWN
    content: str
    status: PostStatus = PostStatus.DRAFT


class PostCreate(PostBase):
    pass


class PostUpdate(BaseSchema):
    content: Optional[str] = None
    status: Optional[PostStatus] = None


class Post(PostBase):
    id: UUID
    clique_id: UUID
    author_user_id: UUID
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    likes_count: int = 0
    comments_count: int = 0
    liked_by_me: bool = False


class Comment(BaseSchema):
    id: UUID
    post_id: UUID
    user_id: UUID
    body: str
    parent_comment_id: Optional[UUID] = None
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class CommentCreate(BaseSchema):
    body: str
    parent_comment_id: Optional[UUID] = None
