from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.deps import get_db, require_active_user
from ...models.user import User
from ...schemas.booking import BookingCreate
from ...services.bookings import (
    cancel_booking,
    confirm_booking,
    create_booking,
    get_clique_bookings,
    get_user_bookings,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("", response_model=dict)
async def create(
    data: BookingCreate,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    booking = await create_booking(
        db,
        str(current_user.id),
        str(data.service_id),
        data.start_ts.isoformat(),
        data.note,
        data.idempotency_key,
    )
    return {"id": booking.id}


@router.get("/me", response_model=dict)
async def list_my_bookings(
    current_user: Annotated[User, Depends(require_active_user)],
    status: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
):
    bookings = await get_user_bookings(db, str(current_user.id), status, cursor, limit)
    return {"items": bookings, "nextCursor": None}


@router.get("/cliques/{clique_id}", response_model=dict)
async def list_clique_bookings(
    clique_id: UUID,
    status: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(20),
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    # TODO: Check ownership
    bookings = await get_clique_bookings(db, str(clique_id), status, cursor, limit)
    return {"items": bookings, "nextCursor": None}


@router.post("/{booking_id}/confirm")
async def confirm(
    booking_id: UUID,
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    # TODO: Check ownership
    await confirm_booking(db, str(booking_id))


@router.post("/{booking_id}/cancel")
async def cancel(
    booking_id: UUID,
    reason: str | None = Query(None),
    current_user: Annotated[User, Depends(require_active_user)],
    db: AsyncSession = Depends(get_db),
):
    await cancel_booking(db, str(booking_id), str(current_user.id), reason)