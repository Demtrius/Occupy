from typing import List

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.clique import Clique
from ..models.user import Occupation, User
from ..schemas import clique as clique_schema
from ..schemas import occupation as occupation_schema
from ..schemas import user as user_schema
from ..schemas.search import SearchResult


async def search_users(db: AsyncSession, query: str, limit: int = 20) -> List[User]:
    """Search users by username or full name."""
    stmt = (
        select(User)
        .where(
            or_(
                User.username.ilike(f"%{query}%"),
                User.full_name.ilike(f"%{query}%"),
            )
        )
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def search_occupations(
    db: AsyncSession, query: str, limit: int = 20
) -> List[Occupation]:
    """Search occupations by name."""
    stmt = select(Occupation).where(Occupation.name.ilike(f"%{query}%")).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


async def search_cliques(db: AsyncSession, query: str, limit: int = 20) -> List[Clique]:
    """Search cliques by name or description."""
    stmt = (
        select(Clique)
        .where(
            or_(
                Clique.name.ilike(f"%{query}%"),
                Clique.description.ilike(f"%{query}%"),
            )
        )
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def unified_search(db: AsyncSession, query: str, limit: int = 20) -> SearchResult:
    """Perform unified search across users, occupations, and cliques."""
    per_section = max(limit // 3, 1)
    users = await search_users(db, query, per_section)
    occupations = await search_occupations(db, query, per_section)
    cliques = await search_cliques(db, query, per_section)

    user_results = [user_schema.User.model_validate(u) for u in users]
    occupation_results = [
        occupation_schema.Occupation.model_validate(o) for o in occupations
    ]
    clique_results = []
    for clique in cliques:
        clique_results.append(
            clique_schema.Clique(
                id=clique.id,
                owner_user_id=clique.owner_user_id,
                name=clique.name,
                description=clique.description,
                image_url=clique.image_url,
                privacy=clique.privacy,
                timezone=clique.timezone,
                cancellation_cutoff_hours=clique.cancellation_cutoff_hours,
                occupation_ids=[],
                created_at=clique.created_at,
                updated_at=clique.updated_at,
            )
        )

    return SearchResult(
        users=user_results,
        occupations=occupation_results,
        cliques=clique_results,
    )
