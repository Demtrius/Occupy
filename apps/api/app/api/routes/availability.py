from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user, require_clique_owner
from ...core.errors import Forbidden, NotFound, Validation
from ...models.availability import Availability
from ...models.enums import Privacy
from ...models.user import User
from ...schemas.availability import (
    Availability as AvailabilitySchema,
    AvailabilityCreate,
    AvailabilityUpdate,
)
from ...services.availability import (
    create_availability,
    delete_availability,
    get_clique_availability,
    update_availability,
)
from ...services.cliques import get_clique_by_id, is_member_of_clique

router = APIRouter(prefix="/availability", tags=["availability"])


@router.post("/", response_model=AvailabilitySchema)
async def create_availability_endpoint(
    clique_id: UUID,
    availability: AvailabilityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    await require_clique_owner(clique_id, current_user, db)
    try:
        return await create_availability(db, clique_id, availability)
    except ValueError as exc:
        raise Validation(str(exc))


@router.get("/{clique_id}", response_model=List[AvailabilitySchema])
async def list_clique_availability(
    clique_id: UUID,
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


@router.put("/{availability_id}", response_model=AvailabilitySchema)
async def update_availability_endpoint(
    availability_id: UUID,
    availability_update: AvailabilityUpdate,
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


@router.delete("/{availability_id}")
async def delete_availability_endpoint(
    availability_id: UUID,
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
