from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...api.openapi_helpers import error_responses, secured
from ...core.errors import Validation
from ...models.user import User
from ...schemas.slots import SlotResponse
from ...services.slots import compute_slots

router = APIRouter(prefix="/api/v1/cliques", tags=["Slots"])


def _parse_iso_dt(value: str, label: str) -> datetime:
    try:
        normalized = value[:-1] + "+00:00" if value.endswith("Z") else value
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise Validation(f"Invalid {label} datetime") from exc
    if parsed.tzinfo is None:
        raise Validation(f"{label} must include timezone information")
    return parsed


@router.get(
    "/{cliqueId}/slots",
    operation_id="CliquesSlots",
    summary="List available slots",
    description="Return available start/end timestamps for a service within the requested window.",
    response_model=SlotResponse,
    responses={
        200: {
            "description": "Computed availability slots",
            "content": {
                "application/json": {
                    "example": {
                        "slots": [
                            {
                                "start_ts": "2024-04-02T14:00:00+00:00",
                                "end_ts": "2024-04-02T15:00:00+00:00",
                            }
                        ]
                    }
                }
            },
        },
        **error_responses(400, 401, 422),
    },
    openapi_extra=secured(),
)
async def list_slots(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    service_id: UUID = Query(
        ..., alias="serviceId", description="Service identifier to compute slots for."
    ),
    window_start: str = Query(
        ...,
        alias="from",
        description="Inclusive ISO 8601 start datetime (timezone-aware).",
    ),
    window_end: str = Query(
        ...,
        alias="to",
        description="Exclusive ISO 8601 end datetime (timezone-aware).",
    ),
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
