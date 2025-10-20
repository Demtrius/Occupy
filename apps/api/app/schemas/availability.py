from datetime import date as DateType
from datetime import datetime
from datetime import time as TimeType
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AvailabilityBase(BaseModel):
    is_recurring: bool
    date: Optional[DateType] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: TimeType
    end_time: TimeType
    valid_from: Optional[DateType] = None
    valid_until: Optional[DateType] = None
    timezone: str


class AvailabilityCreate(AvailabilityBase):
    pass


class AvailabilityUpdate(BaseModel):
    start_time: Optional[TimeType] = None
    end_time: Optional[TimeType] = None
    valid_from: Optional[DateType] = None
    valid_until: Optional[DateType] = None


class Availability(AvailabilityBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    clique_id: UUID
    created_at: datetime
    updated_at: datetime


class Slot(BaseModel):
    start_time: TimeType
    end_time: TimeType
    service_id: UUID
    service_title: str
