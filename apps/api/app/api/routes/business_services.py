from typing import List
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user, require_clique_owner
from ...api.openapi_helpers import error_responses, secured
from ...core.errors import Forbidden, NotFound
from ...models.enums import Privacy
from ...models.service import Service
from ...models.user import User
from ...schemas.service import Service as ServiceSchema
from ...schemas.service import ServiceCreate, ServiceUpdate
from ...services.business_services import (
    create_service,
    delete_service,
    get_clique_services,
    update_service,
)
from ...services.cliques import get_clique_by_id, is_member_of_clique

router = APIRouter(prefix="/api/v1/services", tags=["Services"])


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
    clique_id: UUID = Query(..., description="Clique creating the service"),
    service: ServiceCreate = Body(
        ...,
        examples={
            "duration_with_price": {
                "summary": "Standard service",
                "value": {
                    "title": "Signature facial",
                    "description": "60 minute facial tailored to the client.",
                    "duration_minutes": 60,
                    "price_cents": 12000,
                    "currency": "USD",
                    "is_active": True,
                },
            }
        },
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    await require_clique_owner(clique_id, current_user, db)
    return await create_service(db, clique_id, service)


@router.get(
    "/{clique_id}",
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
    clique_id: UUID,
    active_only: bool = Query(
        True, description="When true, only return active services."
    ),
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
    return await get_clique_services(db, clique_id, active_only)


@router.put(
    "/{service_id}",
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
    service_id: UUID,
    service_update: ServiceUpdate = Body(
        ...,
        examples={
            "toggle_availability": {
                "summary": "Deactivate service",
                "value": {"is_active": False},
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
    "/{service_id}",
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
    service_id: UUID,
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
