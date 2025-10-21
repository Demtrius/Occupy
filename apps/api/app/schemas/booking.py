from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from ..models.enums import BookingStatus, CancelledBy


class BookingCreate(BaseModel):
    service_id: UUID
    start_ts: datetime
    note: Optional[str] = None
    idempotency_key: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    cancelled_by: Optional[CancelledBy] = None
    cancellation_reason: Optional[str] = None
    note: Optional[str] = None


class Booking(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    service_id: UUID
    clique_id: UUID
    user_id: UUID
    start_ts: datetime
    end_ts: datetime
    status: BookingStatus
    cancelled_by: Optional[CancelledBy] = None
    cancellation_reason: Optional[str] = None
    note: Optional[str] = None
    idempotency_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime
