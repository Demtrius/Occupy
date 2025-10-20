from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.availability import Availability
from ..schemas.availability import Availability as AvailabilitySchema
from ..schemas.availability import AvailabilityCreate, AvailabilityUpdate


async def create_availability(
    db: AsyncSession, clique_id: UUID, availability_data: AvailabilityCreate
) -> AvailabilitySchema:
    """Create a new availability slot for a clique."""
    availability = Availability(clique_id=clique_id, **availability_data.model_dump())
    db.add(availability)
    await db.commit()
    await db.refresh(availability)
    return AvailabilitySchema.model_validate(availability)


async def get_clique_availability(
    db: AsyncSession, clique_id: UUID
) -> List[AvailabilitySchema]:
    """Get all availability slots for a clique."""
    stmt = select(Availability).where(Availability.clique_id == clique_id)
    result = await db.execute(stmt)
    availabilities = result.scalars().all()
    return [AvailabilitySchema.model_validate(a) for a in availabilities]


async def update_availability(
    db: AsyncSession, availability_id: UUID, update_data: AvailabilityUpdate
) -> AvailabilitySchema | None:
    """Update an availability slot."""
    stmt = select(Availability).where(Availability.id == availability_id)
    result = await db.execute(stmt)
    availability = result.scalar_one_or_none()
    if not availability:
        return None
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(availability, key, value)
    await db.commit()
    await db.refresh(availability)
    return AvailabilitySchema.model_validate(availability)


async def delete_availability(db: AsyncSession, availability_id: UUID) -> bool:
    """Delete an availability slot."""
    stmt = select(Availability).where(Availability.id == availability_id)
    result = await db.execute(stmt)
    availability = result.scalar_one_or_none()
    if not availability:
        return False
    await db.delete(availability)
    await db.commit()
    return True