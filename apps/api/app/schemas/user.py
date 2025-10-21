from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from ..models.enums import FollowStatus


class UserBase(BaseModel):
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


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    is_private_account: Optional[bool] = None


class User(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseModel):
    email_or_username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenRead(BaseModel):
    access_token: str
    refresh_token: str
    user: User


class Follow(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    follower_user_id: UUID
    followee_user_id: UUID
    status: FollowStatus
    created_at: datetime
