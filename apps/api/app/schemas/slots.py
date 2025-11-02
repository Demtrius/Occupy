from datetime import datetime
from typing import List, Optional
from uuid import UUID

from app.schemas.base import BaseSchema


class Slot(BaseSchema):
    """Individual time slot with camelCase field names"""

    start_ts: datetime
    end_ts: datetime
    service_id: Optional[UUID] = None


class SlotResponse(BaseSchema):
    """Response model for slots endpoint - supports dynamic key structure"""

    slots: List[Slot]
