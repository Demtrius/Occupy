from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from ..models.enums import MembershipStatus, Privacy, Role


class CliqueBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    privacy: Privacy = Privacy.PUBLIC
    timezone: str
    cancellation_cutoff_hours: int = 24
    occupation_ids: List[UUID] = Field(default_factory=list)


class CliqueCreate(CliqueBase):
    pass


class CliqueUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    privacy: Optional[Privacy] = None
    timezone: Optional[str] = None
    cancellation_cutoff_hours: Optional[int] = None
    occupation_ids: Optional[List[UUID]] = None


class CliqueMember(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    clique_id: UUID
    user_id: UUID
    role: Role
    status: MembershipStatus
    created_at: datetime


class CliqueInviteCreate(BaseModel):
    expires_at: Optional[datetime] = None
    max_uses: Optional[int] = Field(default=None, ge=1)


class CliqueInvite(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    clique_id: UUID
    token: str
    expires_at: Optional[datetime] = None
    max_uses: Optional[int] = None
    uses: int
    created_at: datetime


class Clique(CliqueBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_user_id: UUID
    created_at: datetime
    updated_at: datetime
