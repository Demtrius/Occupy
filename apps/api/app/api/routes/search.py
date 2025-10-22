from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, get_optional_user
from ...models.user import User
from ...services.cliques import get_clique_public
from ...services.search import unified_search

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/")
async def search(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> dict[str, Any]:
    """Unified search across users, occupations, and cliques."""
    result = await unified_search(db, q, limit)
    users = [user.model_dump(mode="json") for user in result.users]
    occupations = [
        occupation.model_dump(mode="json") for occupation in result.occupations
    ]

    cliques: list[dict[str, Any]] = []
    requester_id = str(current_user.id) if current_user else None
    for clique in result.cliques:
        payload = await get_clique_public(db, str(clique.id), requester_id)
        if not payload:
            continue
        cliques.append(payload)

    return {"users": users, "occupations": occupations, "cliques": cliques}
