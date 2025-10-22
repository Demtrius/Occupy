from datetime import datetime
from typing import Optional
from uuid import UUID

from app.schemas.base import BaseSchema

from ..models.enums import BookingStatus, CancelledBy


class BookingCreate(BaseSchema):
    service_id: UUID
    start_ts: datetime
    note: Optional[str] = None
    idempotency_key: Optional[str] = None


class BookingReschedule(BaseSchema):
    start_ts: datetime


class BookingUpdate(BaseSchema):
    status: Optional[BookingStatus] = None
    cancelled_by: Optional[CancelledBy] = None
    cancellation_reason: Optional[str] = None
    note: Optional[str] = None


class Booking(BaseSchema):
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
