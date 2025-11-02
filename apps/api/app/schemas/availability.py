from datetime import date as DateType
from datetime import datetime
from datetime import time as TimeType
from typing import Optional
from uuid import UUID

from pydantic import Field

from app.schemas.base import BaseSchema


class AvailabilityBase(BaseSchema):
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


class AvailabilityUpdate(BaseSchema):
    is_recurring: Optional[bool] = None
    date: Optional[DateType] = None
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[TimeType] = None
    end_time: Optional[TimeType] = None
    valid_from: Optional[DateType] = None
    valid_until: Optional[DateType] = None
    timezone: Optional[str] = None


class Availability(AvailabilityBase):
    id: UUID
    clique_id: UUID
    created_at: datetime
    updated_at: datetime


class Slot(BaseSchema):
    start_time: TimeType
    end_time: TimeType
    service_id: UUID
    service_title: str


class CursorPageAvailability(BaseSchema):
    items: list[Availability] = Field(default_factory=list)
    next_cursor: Optional[str] = None
