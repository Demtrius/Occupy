from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema

from ..models.enums import FollowStatus


class UserBase(BaseSchema):
    email: EmailStr
    username: str = Field(min_length=3, max_length=32)
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    is_admin: bool = False
    is_active: bool = True
    is_private_account: bool = False
    is_business_page: bool = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseSchema):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    is_private_account: Optional[bool] = None


class User(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseSchema):
    email_or_username: str
    password: str


class RefreshRequest(BaseSchema):
    refresh_token: str


class TokenRead(BaseSchema):
    access_token: str
    refresh_token: str
    user: User


class Follow(BaseSchema):
    id: UUID
    follower_user_id: UUID
    followee_user_id: UUID
    status: FollowStatus
    created_at: datetime
