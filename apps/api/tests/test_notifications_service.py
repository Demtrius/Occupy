from __future__ import annotations

from uuid import uuid4

import pytest

from app.models.enums import NotificationType
from app.services.notifications import (
    get_user_notifications,
    mark_all_notifications_as_read,
    mark_notification_as_read,
)
from tests.factories import create_user


@pytest.mark.asyncio
async def test_notifications_marking(db_session):
    user = await create_user(db_session)
    await db_session.commit()

    from app.models.notification import Notification

    notification = Notification(
        user_id=user.id,
        type=NotificationType.MESSAGE,
        payload={"msg": "hello"},
    )
    db_session.add(notification)
    await db_session.commit()

    items = await get_user_notifications(db_session, user.id)
    assert len(items) == 1

    assert await mark_notification_as_read(db_session, notification.id, user.id)
    assert not await mark_notification_as_read(db_session, uuid4(), user.id)

    count = await mark_all_notifications_as_read(db_session, user.id)
    assert count == 0
