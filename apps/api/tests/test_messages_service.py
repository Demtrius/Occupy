from __future__ import annotations

from datetime import timedelta
from uuid import uuid4

import pytest

from tests.factories import create_chat, create_user
from tests.utils import assert_error, auth_headers


@pytest.mark.asyncio
async def test_message_delete_retention_window(
    client, db_session, make_token, frozen_time
):
    business = await create_user(db_session, is_business_page=True)
    customer = await create_user(db_session)
    chat = await create_chat(db_session, business=business, client=customer)
    await db_session.commit()

    send_resp = await client.post(
        f"/api/v1/messages/{chat.id}",
        json={"body": "Hi there"},
        headers=auth_headers(make_token(customer)),
    )
    assert send_resp.status_code == 200
    message_id = send_resp.json()["id"]

    delete_resp = await client.delete(
        f"/api/v1/messages/{message_id}",
        headers=auth_headers(make_token(customer)),
    )
    assert delete_resp.status_code == 200

    second_resp = await client.post(
        f"/api/v1/messages/{chat.id}",
        json={"body": "Follow up"},
        headers=auth_headers(make_token(customer)),
    )
    assert second_resp.status_code == 200
    late_message_id = second_resp.json()["id"]

    list_resp = await client.get(
        f"/api/v1/messages/{chat.id}",
        headers=auth_headers(make_token(customer)),
    )
    assert list_resp.status_code == 200
    assert isinstance(list_resp.json(), list)

    frozen_time.tick(delta=timedelta(minutes=16))

    forbidden = await client.delete(
        f"/api/v1/messages/{late_message_id}",
        headers=auth_headers(make_token(customer)),
    )
    assert forbidden.status_code == 403
    assert_error(forbidden, "forbidden")


@pytest.mark.asyncio
async def test_message_delete_requires_sender(client, db_session, make_token):
    business = await create_user(db_session, is_business_page=True)
    customer = await create_user(db_session)
    other_user = await create_user(db_session)
    chat = await create_chat(db_session, business=business, client=customer)
    await db_session.commit()

    send_resp = await client.post(
        f"/api/v1/messages/{chat.id}",
        json={"body": "Hi"},
        headers=auth_headers(make_token(customer)),
    )
    message_id = send_resp.json()["id"]

    forbidden = await client.delete(
        f"/api/v1/messages/{message_id}",
        headers=auth_headers(make_token(other_user)),
    )
    assert forbidden.status_code == 403
    assert_error(forbidden, "forbidden")


@pytest.mark.asyncio
async def test_message_delete_missing_returns_not_found(client, db_session, make_token):
    user = await create_user(db_session, is_business_page=True)
    await db_session.commit()

    missing = await client.delete(
        f"/api/v1/messages/{uuid4()}",
        headers=auth_headers(make_token(user)),
    )
    assert missing.status_code == 404
    assert_error(missing, "not_found")
