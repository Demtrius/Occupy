from __future__ import annotations

from uuid import uuid4

import pytest

from app.schemas.service import ServiceCreate, ServiceUpdate
from app.services.business_services import (
    create_service,
    delete_service,
    get_clique_services,
    update_service,
)
from tests.factories import create_clique, create_user


@pytest.mark.asyncio
async def test_business_service_crud_flow(db_session):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    payload = ServiceCreate(
        title="Consultation",
        description="Initial consult",
        price_minor=2500,
        currency="USD",
        duration_minutes=60,
        buffer_minutes=15,
    )

    created = await create_service(db_session, clique.id, payload)
    assert created.title == "Consultation"

    services = await get_clique_services(db_session, clique.id)
    assert len(services) == 1
    assert services[0].id == created.id

    updated = await update_service(
        db_session,
        created.id,
        ServiceUpdate(description="Updated", is_active=False),
    )
    assert updated is not None
    assert updated.description == "Updated"
    assert updated.is_active is False

    inactive = await get_clique_services(db_session, clique.id, active_only=False)
    assert len(inactive) == 1

    assert await delete_service(db_session, created.id) is True
    assert await delete_service(db_session, created.id) is False


@pytest.mark.asyncio
async def test_update_service_missing_returns_none(db_session):
    missing_id = uuid4()
    assert (
        await update_service(db_session, missing_id, ServiceUpdate(title="X")) is None
    )
    assert await delete_service(db_session, missing_id) is False
