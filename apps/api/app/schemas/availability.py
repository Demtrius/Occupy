from datetime import date, datetime, time
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AvailabilityBase(BaseModel):
    is_recurring: bool
    date: Optional[date] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: time
    end_time: time
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    timezone: str


class AvailabilityCreate(AvailabilityBase):
    pass


class AvailabilityUpdate(BaseModel):
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None


class Availability(AvailabilityBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    clique_id: UUID
    created_at: datetime
    updated_at: datetime
