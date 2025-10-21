from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_clique_owner
from ...core.auth import require_active_user
from ...core.errors import NotFound
from ...models.user import User
from ...schemas.availability import Availability as AvailabilitySchema
from ...schemas.availability import AvailabilityCreate, AvailabilityUpdate
from ...services.availability import (
    create_availability,
    delete_availability,
    get_clique_availability,
    update_availability,
)

router = APIRouter(prefix="/availability", tags=["availability"])


@router.post("/", response_model=AvailabilitySchema)
async def create_availability_endpoint(
    availability: AvailabilityCreate,
    clique_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_clique_owner),
):
    """Create a new availability slot for a clique (owner only)."""
    return await create_availability(db, clique_id, availability)


@router.get("/{clique_id}", response_model=List[AvailabilitySchema])
async def list_clique_availability(
    clique_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """List availability slots for a clique."""
    # TODO: Check if user has access to clique
    return await get_clique_availability(db, clique_id)


@router.put("/{availability_id}", response_model=AvailabilitySchema)
async def update_availability_endpoint(
    availability_id: UUID,
    availability_update: AvailabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """Update an availability slot (owner only)."""
    # TODO: Check ownership
    updated = await update_availability(db, availability_id, availability_update)
    if not updated:
        raise NotFound("Availability not found")
    return updated


@router.delete("/{availability_id}")
async def delete_availability_endpoint(
    availability_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """Delete an availability slot (owner only)."""
    # TODO: Check ownership
    success = await delete_availability(db, availability_id)
    if not success:
        raise NotFound("Availability not found")
    return {"message": "Availability deleted"}