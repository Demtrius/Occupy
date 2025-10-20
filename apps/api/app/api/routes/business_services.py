from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user, require_clique_owner
from ...core.errors import NotFound
from ...models.user import User
from ...schemas.service import Service as ServiceSchema
from ...schemas.service import ServiceCreate, ServiceUpdate
from ...services.business_services import (
    create_service,
    delete_service,
    get_clique_services,
    update_service,
)

router = APIRouter(prefix="/services", tags=["business_services"])


@router.post("/", response_model=ServiceSchema)
async def create_service_endpoint(
    service: ServiceCreate,
    clique_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_clique_owner),
):
    """Create a new service for a clique (owner only)."""
    return await create_service(db, clique_id, service)


@router.get("/{clique_id}", response_model=List[ServiceSchema])
async def list_clique_services(
    clique_id: UUID,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """List services for a clique."""
    # TODO: Check if user has access to clique
    return await get_clique_services(db, clique_id, active_only)


@router.put("/{service_id}", response_model=ServiceSchema)
async def update_service_endpoint(
    service_id: UUID,
    service_update: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """Update a service (owner only)."""
    # TODO: Check ownership
    updated = await update_service(db, service_id, service_update)
    if not updated:
        raise NotFound("Service not found")
    return updated


@router.delete("/{service_id}")
async def delete_service_endpoint(
    service_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """Delete a service (owner only)."""
    # TODO: Check ownership
    success = await delete_service(db, service_id)
    if not success:
        raise NotFound("Service not found")
    return {"message": "Service deleted"}