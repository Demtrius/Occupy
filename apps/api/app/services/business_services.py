from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.service import Service
from ..schemas.service import Service as ServiceSchema
from ..schemas.service import ServiceCreate, ServiceUpdate


async def create_service(
    db: AsyncSession, clique_id: UUID, service_data: ServiceCreate
) -> ServiceSchema:
    """Create a new service for a clique."""
    service = Service(clique_id=clique_id, **service_data.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return ServiceSchema.model_validate(service)


async def get_clique_services(
    db: AsyncSession, clique_id: UUID, active_only: bool = True
) -> List[ServiceSchema]:
    """Get services for a clique."""
    stmt = select(Service).where(Service.clique_id == clique_id)
    if active_only:
        stmt = stmt.where(Service.is_active == True)
    result = await db.execute(stmt)
    services = result.scalars().all()
    return [ServiceSchema.model_validate(s) for s in services]


async def update_service(
    db: AsyncSession, service_id: UUID, update_data: ServiceUpdate
) -> ServiceSchema | None:
    """Update a service."""
    stmt = select(Service).where(Service.id == service_id)
    result = await db.execute(stmt)
    service = result.scalar_one_or_none()
    if not service:
        return None
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(service, key, value)
    await db.commit()
    await db.refresh(service)
    return ServiceSchema.model_validate(service)


async def delete_service(db: AsyncSession, service_id: UUID) -> bool:
    """Delete a service."""
    stmt = select(Service).where(Service.id == service_id)
    result = await db.execute(stmt)
    service = result.scalar_one_or_none()
    if not service:
        return False
    await db.delete(service)
    await db.commit()
    return True