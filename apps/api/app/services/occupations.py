import re
from typing import List
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import CliqueOccupation, Occupation, UserOccupation
from ..schemas.occupation import Occupation as OccupationSchema, OccupationCreate


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


def _generate_slug(name: str) -> str:
    """Generate a URL-friendly slug from occupation name."""
    # Convert to lowercase, replace spaces and special chars with hyphens
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'[\s_-]+', '-', slug)
    return slug.strip('-')


async def create_occupation(db: AsyncSession, occupation_data: OccupationCreate) -> OccupationSchema:
    """Create a new occupation."""
    # Capitalize the occupation name (title case)
    capitalized_name = occupation_data.name.strip().title()

    # Check if occupation with this name already exists
    stmt = select(Occupation).where(Occupation.name == capitalized_name)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise ValueError(f"Occupation '{capitalized_name}' already exists")

    base_slug = _generate_slug(capitalized_name)
    slug = base_slug
    counter = 1

    # Ensure slug uniqueness
    while True:
        stmt = select(Occupation).where(Occupation.slug == slug)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing is None:
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    occupation = Occupation(name=capitalized_name, slug=slug)
    db.add(occupation)
    await db.commit()
    await db.refresh(occupation)
    return OccupationSchema.model_validate(occupation)


async def update_user_occupations(
    db: AsyncSession, user_id: UUID, occupation_ids: List[UUID]
) -> None:
    """Update user's occupations (replace all)."""
    # Delete existing
    await db.execute(delete(UserOccupation).where(UserOccupation.user_id == user_id))
    # Add new
    for occ_id in occupation_ids:
        db.add(UserOccupation(user_id=user_id, occupation_id=occ_id))
    await db.commit()


async def update_clique_occupations(
    db: AsyncSession, clique_id: UUID, occupation_ids: List[UUID]
) -> None:
    """Update clique's occupations (replace all)."""
    # Delete existing
    await db.execute(delete(CliqueOccupation).where(CliqueOccupation.clique_id == clique_id))
    # Add new
    for occ_id in occupation_ids:
        db.add(CliqueOccupation(clique_id=clique_id, occupation_id=occ_id))
    await db.commit()