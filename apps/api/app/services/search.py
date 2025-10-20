from typing import List

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.clique import Clique
from ..models.user import Occupation, User
from ..schemas.search import SearchResult


async def search_users(
    db: AsyncSession, query: str, limit: int = 20
) -> List[User]:
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
    stmt = (
        select(Occupation)
        .where(Occupation.name.ilike(f"%{query}%"))
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def search_cliques(
    db: AsyncSession, query: str, limit: int = 20
) -> List[Clique]:
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


async def unified_search(
    db: AsyncSession, query: str, limit: int = 20
) -> SearchResult:
    """Perform unified search across users, occupations, and cliques."""
    users = await search_users(db, query, limit // 3)
    occupations = await search_occupations(db, query, limit // 3)
    cliques = await search_cliques(db, query, limit // 3)

    return SearchResult(
        users=users,
        occupations=occupations,
        cliques=cliques,
    )