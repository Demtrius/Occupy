from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...core.errors import Validation
from ...models.user import User
from ...services.slots import compute_slots

router = APIRouter(prefix="/cliques", tags=["availability"])


def _parse_iso_dt(value: str, label: str) -> datetime:
    try:
        normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise Validation(f"Invalid {label} datetime") from exc
    if parsed.tzinfo is None:
        raise Validation(f"{label} must include timezone information")
    return parsed


@router.get("/{clique_id}/slots")
async def list_slots(
    clique_id: UUID,
    service_id: UUID = Query(..., alias="serviceId"),
    window_start: str = Query(..., alias="from"),
    window_end: str = Query(..., alias="to"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    start_dt = _parse_iso_dt(window_start, "from")
    end_dt = _parse_iso_dt(window_end, "to")
    if start_dt >= end_dt:
        raise Validation("Invalid datetime range")
    try:
        slots = await compute_slots(
            db,
            str(clique_id),
            str(service_id),
            start_dt,
            end_dt,
        )
    except ValueError as exc:
        raise Validation(str(exc))
    return {"slots": slots}
