from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from ..models.enums import Privacy


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


class Clique(CliqueBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_user_id: UUID
    created_at: datetime
    updated_at: datetime
