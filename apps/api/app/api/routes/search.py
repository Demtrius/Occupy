from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db
from ...schemas.search import SearchResult
from ...services.search import unified_search

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/", response_model=SearchResult)
async def search(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Unified search across users, occupations, and cliques."""
    return await unified_search(db, q, limit)