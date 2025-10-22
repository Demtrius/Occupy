from datetime import datetime
from typing import Optional
from uuid import UUID

from app.schemas.base import BaseSchema


class ServiceBase(BaseSchema):
    title: str
    description: Optional[str] = None
    price_minor: Optional[int] = None
    currency: str = "EUR"
    duration_minutes: int
    buffer_minutes: int = 0
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseSchema):
    title: Optional[str] = None
    description: Optional[str] = None
    price_minor: Optional[int] = None
    duration_minutes: Optional[int] = None
    buffer_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class Service(ServiceBase):
    id: UUID
    clique_id: UUID
    created_at: datetime
    updated_at: datetime
