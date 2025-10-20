from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from ..models.enums import Privacy


class CliqueBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    privacy: Privacy = Privacy.PUBLIC
    timezone: str
    cancellation_cutoff_hours: int = 24


class CliqueCreate(CliqueBase):
    pass


class CliqueUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    privacy: Optional[Privacy] = None
    timezone: Optional[str] = None
    cancellation_cutoff_hours: Optional[int] = None


class Clique(CliqueBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_user_id: UUID
    created_at: datetime
    updated_at: datetime