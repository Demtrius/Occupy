from __future__ import annotations

from datetime import date, time
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.api.routes import availability as availability_routes
from app.api.routes.availability import AvailabilityCreateParams
from app.core.errors import Forbidden, NotFound, Validation
from app.models.enums import Privacy
from app.schemas.availability import AvailabilityCreate, AvailabilityUpdate
from tests.factories import create_availability, create_clique, create_user


def _availability_payload() -> AvailabilityCreate:
    return AvailabilityCreate(
        is_recurring=False,
        date=date.today(),
        start_time=time(9, 0),
        end_time=time(10, 0),
        timezone="UTC",
    )


@pytest.mark.asyncio
async def test_create_availability_endpoint_validation(db_session, monkeypatch):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    monkeypatch.setattr(
        availability_routes,
        "create_availability",
        AsyncMock(side_effect=ValueError("bad payload")),
    )

    with pytest.raises(Validation):
        await availability_routes.create_availability_endpoint(
            AvailabilityCreateParams(clique_id=clique.id),
            _availability_payload(),
            db_session,
            owner,
        )


@pytest.mark.asyncio
async def test_list_clique_availability_private_requires_member(db_session):
    owner = await create_user(db_session, is_business_page=True)
    outsider = await create_user(db_session)
    clique = await create_clique(db_session, owner=owner, privacy=Privacy.PRIVATE)
    await db_session.commit()

    with pytest.raises(Forbidden):
        await availability_routes.list_clique_availability(
            clique.id,
            db=db_session,
            current_user=outsider,
        )


@pytest.mark.asyncio
async def test_list_clique_availability_success(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    await create_availability(db_session, clique=clique)
    await db_session.commit()

    results = await availability_routes.list_clique_availability(
        clique.id,
        cursor=None,
        limit=10,
        db=db_session,
        current_user=owner,
    )
    assert len(results.items) == 1


@pytest.mark.asyncio
async def test_list_clique_availability_not_found(db_session):
    user = await create_user(db_session, is_business_page=True)
    await db_session.commit()

    with pytest.raises(NotFound):
        await availability_routes.list_clique_availability(
            uuid4(),
            db=db_session,
            current_user=user,
        )


@pytest.mark.asyncio
async def test_update_availability_endpoint_validation_error(db_session, monkeypatch):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    availability = await create_availability(db_session, clique=clique)
    await db_session.commit()

    monkeypatch.setattr(
        availability_routes,
        "update_availability",
        AsyncMock(side_effect=ValueError("bad update")),
    )

    with pytest.raises(Validation):
        await availability_routes.update_availability_endpoint(
            availability.id,
            AvailabilityUpdate(start_time=time(8, 0)),
            db_session,
            owner,
        )


@pytest.mark.asyncio
async def test_update_availability_endpoint_missing(db_session):
    owner = await create_user(db_session, is_business_page=True)
    await db_session.commit()

    with pytest.raises(NotFound):
        await availability_routes.update_availability_endpoint(
            uuid4(),
            AvailabilityUpdate(start_time=time(7, 0)),
            db_session,
            owner,
        )


@pytest.mark.asyncio
async def test_update_availability_endpoint_not_found_after_service(
    db_session, monkeypatch
):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    availability = await create_availability(db_session, clique=clique)
    await db_session.commit()

    monkeypatch.setattr(
        availability_routes,
        "update_availability",
        AsyncMock(return_value=None),
    )

    with pytest.raises(NotFound):
        await availability_routes.update_availability_endpoint(
            availability.id,
            AvailabilityUpdate(start_time=time(7, 30)),
            db_session,
            owner,
        )


@pytest.mark.asyncio
async def test_update_availability_endpoint_success(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    availability = await create_availability(db_session, clique=clique)
    await db_session.commit()

    updated = await availability_routes.update_availability_endpoint(
        availability.id,
        AvailabilityUpdate(start_time=time(8, 0)),
        db_session,
        owner,
    )
    assert updated.start_time.hour == 8


@pytest.mark.asyncio
async def test_delete_availability_endpoint_success_and_missing(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    availability = await create_availability(db_session, clique=clique)
    await db_session.commit()

    result = await availability_routes.delete_availability_endpoint(
        availability.id,
        db_session,
        owner,
    )
    assert result == {"message": "Availability deleted"}

    with pytest.raises(NotFound):
        await availability_routes.delete_availability_endpoint(
            uuid4(),
            db_session,
            owner,
        )


@pytest.mark.asyncio
async def test_delete_availability_endpoint_failed_service(db_session, monkeypatch):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    availability = await create_availability(db_session, clique=clique)
    await db_session.commit()

    monkeypatch.setattr(
        availability_routes,
        "delete_availability",
        AsyncMock(return_value=False),
    )

    with pytest.raises(NotFound):
        await availability_routes.delete_availability_endpoint(
            availability.id,
            db_session,
            owner,
        )
