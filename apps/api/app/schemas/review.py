from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseSchema


class ReviewBase(BaseSchema):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseSchema):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class Review(ReviewBase):
    id: UUID
    booking_id: UUID
    rater_user_id: UUID
    created_at: datetime
