from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import CliqueOccupation, Occupation, UserOccupation
from ..schemas.occupation import Occupation as OccupationSchema


async def get_occupations(db: AsyncSession, limit: int = 50) -> List[OccupationSchema]:
    """Get all occupations."""
    stmt = select(Occupation).limit(limit)
    result = await db.execute(stmt)
    occupations = result.scalars().all()
    return [OccupationSchema.model_validate(o) for o in occupations]


async def search_occupations(
    db: AsyncSession, query: str, limit: int = 20
) -> List[OccupationSchema]:
    """Search occupations by name."""
    stmt = (
        select(Occupation)
        .where(Occupation.name.ilike(f"%{query}%"))
        .limit(limit)
    )
    result = await db.execute(stmt)
    occupations = result.scalars().all()
    return [OccupationSchema.model_validate(o) for o in occupations]


async def update_user_occupations(
    db: AsyncSession, user_id: UUID, occupation_ids: List[UUID]
) -> None:
    """Update user's occupations (replace all)."""
    # Delete existing
    await db.execute(
        UserOccupation.__table__.delete().where(UserOccupation.user_id == user_id)
    )
    # Add new
    for occ_id in occupation_ids:
        db.add(UserOccupation(user_id=user_id, occupation_id=occ_id))
    await db.commit()


async def update_clique_occupations(
    db: AsyncSession, clique_id: UUID, occupation_ids: List[UUID]
) -> None:
    """Update clique's occupations (replace all)."""
    # Delete existing
    await db.execute(
        CliqueOccupation.__table__.delete().where(CliqueOccupation.clique_id == clique_id)
    )
    # Add new
    for occ_id in occupation_ids:
        db.add(CliqueOccupation(clique_id=clique_id, occupation_id=occ_id))
    await db.commit()