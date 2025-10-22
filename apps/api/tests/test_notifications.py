from __future__ import annotations

import pytest

from app.models.enums import NotificationType
from app.models.notification import Notification
from tests.factories import create_user
from tests.utils import auth_headers


@pytest.mark.asyncio
async def test_notifications_flow(client, db_session, make_token):
    user = await create_user(db_session)
    notification = Notification(
        user_id=user.id,
        type=NotificationType.MESSAGE,
        payload={"message": "hello"},
    )
    db_session.add(notification)
    await db_session.commit()

    headers = auth_headers(make_token(user))
    list_resp = await client.get("/api/v1/notifications/", headers=headers)
    assert list_resp.status_code == 200
    body = list_resp.json()
    assert body[0]["id"] == str(notification.id)

    mark_resp = await client.put(
        f"/api/v1/notifications/{notification.id}/read",
        headers=headers,
    )
    assert mark_resp.status_code == 200
    assert mark_resp.json()["is_read"] is True

    mark_all_resp = await client.put("/api/v1/notifications/read-all", headers=headers)
    assert mark_all_resp.status_code == 200
