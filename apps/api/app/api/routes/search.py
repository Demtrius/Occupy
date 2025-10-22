from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, get_optional_user
from ...api.openapi_helpers import error_responses
from ...models.user import User
from ...services.cliques import get_clique_public
from ...services.search import unified_search

router = APIRouter(prefix="/api/v1/search", tags=["Search"])


@router.get(
    "",
    summary="Unified search",
    description="Search across users, occupations, and cliques with a single query.",
    responses={
        200: {
            "description": "Search results",
            "content": {
                "application/json": {
                    "example": {
                        "users": [
                            {
                                "id": "d0a93f94-9fab-41a2-964d-8f6a78524c1d",
                                "username": "clique_founder",
                                "full_name": "Clique Founder",
                            }
                        ],
                        "occupations": [
                            {
                                "id": "9b07c852-0cf4-4d05-857f-46bd7d4b52c5",
                                "name": "Photographer",
                            }
                        ],
                        "cliques": [
                            {
                                "id": "257c6140-3ab2-4e74-bac6-41b4ed9f8f2e",
                                "name": "Clique Studio",
                                "privacy": "private",
                            }
                        ],
                    }
                }
            },
        },
        **error_responses(422),
    },
)
async def search(
    q: str = Query(
        ...,
        min_length=1,
        max_length=100,
        description="Search term applied to users, occupations, and cliques.",
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
        description="Maximum number of results per collection.",
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> dict[str, Any]:
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
