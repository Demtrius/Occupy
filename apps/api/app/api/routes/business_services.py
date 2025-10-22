from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user, require_clique_owner
from ...core.errors import Forbidden, NotFound
from ...models.service import Service
from ...models.user import User
from ...models.enums import Privacy
from ...schemas.service import Service as ServiceSchema
from ...schemas.service import ServiceCreate, ServiceUpdate
from ...services.business_services import (
    create_service,
    delete_service,
    get_clique_services,
    update_service,
)
from ...services.cliques import get_clique_by_id, is_member_of_clique

router = APIRouter(prefix="/services", tags=["business_services"])


@router.post("/", response_model=ServiceSchema)
async def create_service_endpoint(
    clique_id: UUID,
    service: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    await require_clique_owner(clique_id, current_user, db)
    return await create_service(db, clique_id, service)


@router.get("/{clique_id}", response_model=List[ServiceSchema])
async def list_clique_services(
    clique_id: UUID,
    active_only: bool = True,
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


@router.put("/{service_id}", response_model=ServiceSchema)
async def update_service_endpoint(
    service_id: UUID,
    service_update: ServiceUpdate,
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


@router.delete("/{service_id}")
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
