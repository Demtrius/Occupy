from __future__ import annotations

from datetime import timedelta

import pytest

from app.core.errors import Forbidden
from app.schemas.chat import MessageCreate
from app.services.messages import (
    delete_message,
    get_chat_messages,
    send_message,
)
from tests.factories import create_chat, create_user


@pytest.mark.asyncio
async def test_send_and_list_messages_service(db_session):
    business = await create_user(db_session, is_business_page=True)
    customer = await create_user(db_session)
    chat = await create_chat(db_session, business=business, client=customer)
    await db_session.commit()

    created = await send_message(
        db_session,
        chat.id,
        business.id,
        MessageCreate(body="Hello!"),
    )
    assert created.body == "Hello!"

    messages = await get_chat_messages(db_session, chat.id)
    assert len(messages) == 1
    assert messages[0].body == "Hello!"


@pytest.mark.asyncio
async def test_delete_message_constraints(db_session, frozen_time):
    business = await create_user(db_session, is_business_page=True)
    customer = await create_user(db_session)
    chat = await create_chat(db_session, business=business, client=customer)
    await db_session.commit()

    message = await send_message(
        db_session,
        chat.id,
        business.id,
        MessageCreate(body="Hi"),
    )
    assert await delete_message(db_session, message.id, business.id) is True
    assert await delete_message(db_session, message.id, business.id) is False

    later_message = await send_message(
        db_session,
        chat.id,
        business.id,
        MessageCreate(body="Follow up"),
    )

    with pytest.raises(Forbidden):
        await delete_message(db_session, later_message.id, customer.id)

    frozen_time.tick(delta=timedelta(minutes=16))
    with pytest.raises(Forbidden):
        await delete_message(db_session, later_message.id, business.id)
