from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from ..models.enums import BookingStatus, CancelledBy


class BookingBase(BaseModel):
    service_id: UUID
    start_ts: datetime
    end_ts: datetime
    status: BookingStatus = BookingStatus.PENDING
    cancelled_by: Optional[CancelledBy] = None
    cancellation_reason: Optional[str] = None
    note: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    cancelled_by: Optional[CancelledBy] = None
    cancellation_reason: Optional[str] = None
    note: Optional[str] = None


class Booking(BookingBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    clique_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
