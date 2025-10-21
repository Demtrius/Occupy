from __future__ import annotations

import pytest
from starlette.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from tests.factories import create_chat, create_clique, create_service, create_user


@pytest.mark.asyncio
async def test_chat_websocket_broadcast(app_fixture, db_session, make_token):
    business = await create_user(db_session, is_business_page=True)
    client_user = await create_user(db_session)
    chat = await create_chat(db_session, business=business, client=client_user)
    await db_session.commit()

    token = make_token(business)

    with TestClient(app_fixture) as test_client:
        with test_client.websocket_connect(f"/ws/chat/{chat.id}?token={token}") as ws:
            payload = {"content": "hello"}
            ws.send_json(payload)
            message = ws.receive_json()
            assert message["content"] == "hello"
            assert message["user_id"] == str(business.id)


@pytest.mark.asyncio
async def test_booking_websocket_requires_owner(app_fixture, db_session, make_token):
    owner = await create_user(db_session, is_business_page=True)
    clique = await create_clique(db_session, owner=owner)
    await db_session.commit()

    owner_token = make_token(owner)
    stranger = await create_user(db_session)
    await db_session.commit()
    stranger_token = make_token(stranger)

    with TestClient(app_fixture) as test_client:
        with test_client.websocket_connect(
            f"/ws/bookings/{clique.id}?token={owner_token}"
        ) as ws:
            ws.send_json({"ping": True})

        with pytest.raises(WebSocketDisconnect):
            with test_client.websocket_connect(
                f"/ws/bookings/{clique.id}?token={stranger_token}"
            ):
                pass
