from typing import List
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user, require_clique_owner
from ...api.openapi_helpers import error_responses, secured
from ...models.user import User
from ...schemas.occupation import Occupation as OccupationSchema
from ...services.occupations import (
    get_occupations,
    search_occupations,
    update_clique_occupations,
    update_user_occupations,
)

router = APIRouter(prefix="/api/v1/occupations", tags=["Occupations"])


@router.get(
    "",
    summary="List occupations",
    description="Return top occupations in the catalog ordered by usage.",
    response_model=List[OccupationSchema],
    responses={
        200: {"description": "Occupations list"},
        **error_responses(422),
    },
)
async def list_occupations(
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await get_occupations(db, limit)


@router.get(
    "/search",
    summary="Search occupations",
    description="Search occupation taxonomy by name prefix.",
    response_model=List[OccupationSchema],
    responses={
        200: {"description": "Search results"},
        **error_responses(422),
    },
)
async def search_occupations_endpoint(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await search_occupations(db, q, limit)


@router.put(
    "/user",
    summary="Update my occupations",
    description="Replace the authenticated user's occupation list.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "Occupations updated",
            "content": {
                "application/json": {"example": {"message": "User occupations updated"}}
            },
        },
        **error_responses(401, 422),
    },
    openapi_extra=secured(),
)
async def update_user_occupations_endpoint(
    occupation_ids: List[UUID] = Body(
        ...,
        examples={
            "studio_owner": {
                "summary": "Replace occupations",
                "value": [
                    "9b07c852-0cf4-4d05-857f-46bd7d4b52c5",
                    "8f9d6c2a-9525-4cd3-b963-59f82a28cd31",
                ],
            }
        },
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_active_user),
):
    await update_user_occupations(db, current_user.id, occupation_ids)
    return {"message": "User occupations updated"}


@router.put(
    "/clique/{clique_id}",
    summary="Update clique occupations",
    description="Clique owners set the occupations associated with their business.",
    response_model=dict[str, str],
    responses={
        200: {
            "description": "Clique occupations updated",
            "content": {
                "application/json": {
                    "example": {"message": "Clique occupations updated"}
                }
            },
        },
        **error_responses(401, 403, 404, 422),
    },
    openapi_extra=secured(),
)
async def update_clique_occupations_endpoint(
    clique_id: UUID,
    occupation_ids: List[UUID] = Body(
        ...,
        examples={
            "studio_owner": {
                "summary": "Replace clique occupations",
                "value": [
                    "9b07c852-0cf4-4d05-857f-46bd7d4b52c5",
                    "8f9d6c2a-9525-4cd3-b963-59f82a28cd31",
                ],
            }
        },
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_clique_owner),
):
    await update_clique_occupations(db, clique_id, occupation_ids)
    return {"message": "Clique occupations updated"}
