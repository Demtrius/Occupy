from typing import Optional
from uuid import UUID
from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema
from ..models.enums import FeedbackType


class FeedbackBase(BaseSchema):
    name: str = Field(..., max_length=100)
    email: EmailStr
    message: str
    feedback_type: FeedbackType = FeedbackType.GENERAL_FEEDBACK


class FeedbackCreate(FeedbackBase):
    pass


class FeedbackRead(FeedbackBase):
    id: UUID
    created_at: datetime
    is_processed: bool
    notes: Optional[str] = None
