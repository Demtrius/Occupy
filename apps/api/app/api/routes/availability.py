from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Path, status
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user, require_clique_owner
from ...api.openapi_helpers import error_responses, secured
from ...core.errors import Forbidden, NotFound, Validation
from ...models.availability import Availability
from ...models.enums import Privacy
from ...models.user import User
from ...schemas.availability import (
    Availability as AvailabilitySchema,
)
from ...schemas.availability import (
    AvailabilityCreate,
    AvailabilityUpdate,
)
from ...schemas.base import BaseSchema
from ...services.availability import (
    create_availability,
    delete_availability,
    get_clique_availability,
    update_availability,
)
from ...services.cliques import get_clique_by_id, is_member_of_clique

router = APIRouter(prefix="/api/v1/availability", tags=["Availability"])


class AvailabilityCreateParams(BaseSchema):
    clique_id: UUID = Field(..., description="Clique owning the availability")


@router.post(
    "",
    operation_id="AvailabilityCreate",
    summary="Create availability window",
    description="Clique owners define recurring or single-day availability windows.",
    response_model=AvailabilitySchema,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Availability created"},
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def create_availability_endpoint(
    params: AvailabilityCreateParams = Depends(),
    availability: AvailabilityCreate = Body(
        ...,
        examples={
            "weekday": {
                "summary": "Weekly recurring hours",
                "value": {
                    "isRecurring": True,
                    "dayOfWeek": 4,
                    "startTime": "09:00:00",
                    "endTime": "17:00:00",
                    "timezone": "UTC",
                },
            }
        },
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    clique_id = params.clique_id
    await require_clique_owner(clique_id, current_user, db)
    try:
        return await create_availability(db, clique_id, availability)
    except ValueError as exc:
        raise Validation(str(exc))


@router.get(
    "/{cliqueId}",
    operation_id="AvailabilityByCliqueId",
    summary="List clique availability",
    description="Return available booking windows visible to the current user.",
    response_model=List[AvailabilitySchema],
    responses={
        200: {"description": "Availability windows"},
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def list_clique_availability(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    clique = await get_clique_by_id(db, str(clique_id))
    if not clique:
        raise NotFound("Clique not found")
    if clique.privacy == Privacy.PRIVATE and clique.owner_user_id != current_user.id:
        is_member = await is_member_of_clique(db, str(clique_id), str(current_user.id))
        if not is_member:
            raise Forbidden()
    return await get_clique_availability(db, clique_id)


@router.put(
    "/{availabilityId}",
    operation_id="AvailabilityUpdateById",
    summary="Update availability window",
    description="Modify the timing or cadence of an availability window.",
    response_model=AvailabilitySchema,
    responses={
        200: {"description": "Availability updated"},
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def update_availability_endpoint(
    availability_id: Annotated[UUID, Path(alias="availabilityId")],
    availability_update: AvailabilityUpdate = Body(
        ...,
        examples={
            "shorter_window": {
                "summary": "Adjust time range",
                "value": {"startTime": "10:00:00", "endTime": "15:00:00"},
            }
        },
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    availability_instance = await db.get(Availability, availability_id)
    if not availability_instance:
        raise NotFound("Availability not found")
    await require_clique_owner(availability_instance.clique_id, current_user, db)
    try:
        updated = await update_availability(db, availability_id, availability_update)
    except ValueError as exc:
        raise Validation(str(exc))
    if not updated:
        raise NotFound("Availability not found")
    return updated


@router.delete(
    "/{availabilityId}",
    operation_id="AvailabilityDeleteById",
    summary="Delete availability window",
    description="Remove an availability window owned by the clique.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "Availability deleted",
            "content": {
                "application/json": {"example": {"message": "Availability deleted"}}
            },
        },
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def delete_availability_endpoint(
    availability_id: Annotated[UUID, Path(alias="availabilityId")],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    availability_instance = await db.get(Availability, availability_id)
    if not availability_instance:
        raise NotFound("Availability not found")
    await require_clique_owner(availability_instance.clique_id, current_user, db)
    success = await delete_availability(db, availability_id)
    if not success:
        raise NotFound("Availability not found")
    return {"message": "Availability deleted"}
