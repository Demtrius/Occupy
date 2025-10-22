from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Path, status
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user, require_clique_owner
from ...api.openapi_helpers import error_responses, secured
from ...core.errors import Forbidden, NotFound
from ...models.enums import Privacy
from ...models.service import Service
from ...models.user import User
from ...schemas.service import Service as ServiceSchema
from ...schemas.service import ServiceCreate, ServiceUpdate
from ...schemas.base import BaseSchema
from ...services.business_services import (
    create_service,
    delete_service,
    get_clique_services,
    update_service,
)
from ...services.cliques import get_clique_by_id, is_member_of_clique

router = APIRouter(prefix="/api/v1/services", tags=["Services"])


class ServiceCreateParams(BaseSchema):
    clique_id: UUID = Field(..., alias="cliqueId", description="Clique creating the service")


class ServiceListParams(BaseSchema):
    active_only: bool = Field(
        default=True, description="When true, only return active services."
    )


@router.post(
    "",
    summary="Create service",
    description="Clique owners define a bookable service with pricing metadata.",
    response_model=ServiceSchema,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "Service created"},
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def create_service_endpoint(
    params: ServiceCreateParams = Depends(),
    service: ServiceCreate = Body(
        ...,
        examples={
            "duration_with_price": {
                "summary": "Standard service",
                "value": {
                    "title": "Signature facial",
                    "description": "60 minute facial tailored to the client.",
                    "durationMinutes": 60,
                    "priceMinor": 12000,
                    "currency": "USD",
                    "isActive": True,
                },
            }
        },
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    clique_id = params.clique_id
    await require_clique_owner(clique_id, current_user, db)
    return await create_service(db, clique_id, service)


@router.get(
    "/{cliqueId}",
    summary="List clique services",
    description="Return services configured for a clique, optionally only active ones.",
    response_model=List[ServiceSchema],
    responses={
        200: {"description": "Services list"},
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def list_clique_services(
    clique_id: Annotated[UUID, Path(alias="cliqueId")],
    params: ServiceListParams = Depends(),
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
    return await get_clique_services(db, clique_id, params.active_only)


@router.put(
    "/{serviceId}",
    summary="Update service",
    description="Modify details of a service owned by the clique.",
    response_model=ServiceSchema,
    responses={
        200: {"description": "Service updated"},
        **error_responses(400, 401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def update_service_endpoint(
    service_id: Annotated[UUID, Path(alias="serviceId")],
    service_update: ServiceUpdate = Body(
        ...,
        examples={
            "toggle_availability": {
                "summary": "Deactivate service",
                "value": {"isActive": False},
            }
        },
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    service = await db.get(Service, service_id)
    if not service:
        raise NotFound("Service not found")
    await require_clique_owner(service.clique_id, current_user, db)
    updated = await update_service(db, service_id, service_update)
    if not updated:
        raise NotFound("Service not found")
    return updated


@router.delete(
    "/{serviceId}",
    summary="Delete service",
    description="Remove a service definition owned by the clique.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "Service deleted",
            "content": {
                "application/json": {"example": {"message": "Service deleted"}}
            },
        },
        **error_responses(401, 403, 404),
    },
    openapi_extra=secured(),
)
async def delete_service_endpoint(
    service_id: Annotated[UUID, Path(alias="serviceId")],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    service = await db.get(Service, service_id)
    if not service:
        raise NotFound("Service not found")
    await require_clique_owner(service.clique_id, current_user, db)
    success = await delete_service(db, service_id)
    if not success:
        raise NotFound("Service not found")
    return {"message": "Service deleted"}
