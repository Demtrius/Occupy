from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user, require_clique_owner
from ...models.user import User
from ...schemas.occupation import Occupation as OccupationSchema
from ...services.occupations import (
    get_occupations,
    search_occupations,
    update_clique_occupations,
    update_user_occupations,
)

router = APIRouter(prefix="/occupations", tags=["occupations"])


@router.get("/", response_model=List[OccupationSchema])
async def list_occupations(
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all occupations."""
    return await get_occupations(db, limit)


@router.get("/search", response_model=List[OccupationSchema])
async def search_occupations_endpoint(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search occupations by name."""
    return await search_occupations(db, q, limit)


@router.put("/user")
async def update_user_occupations_endpoint(
    occupation_ids: List[UUID],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    """Update current user's occupations."""
    await update_user_occupations(db, current_user.id, occupation_ids)
    return {"message": "User occupations updated"}


@router.put("/clique/{clique_id}")
async def update_clique_occupations_endpoint(
    clique_id: UUID,
    occupation_ids: List[UUID],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_clique_owner),
):
    """Update clique's occupations (owner only)."""
    await update_clique_occupations(db, clique_id, occupation_ids)
    return {"message": "Clique occupations updated"}