from __future__ import annotations

import asyncio

import pytest

from app.core import auth as auth_core
from tests.factories import create_user


def test_hash_and_verify_password():
    password = "S3cureP@ss"
    hashed = auth_core.hash_password(password)
    assert auth_core.verify_password(password, hashed)
    assert not auth_core.verify_password("wrong", hashed)


def test_create_and_decode_token():
    token = auth_core.create_access_token({"sub": "user"})
    decoded = auth_core.decode_token(token)
    assert decoded["sub"] == "user"


@pytest.mark.asyncio
async def test_require_helpers(db_session, async_session_maker):
    auth_core.sessionmaker = async_session_maker
    user = await create_user(db_session)
    await db_session.commit()

    token = auth_core.create_access_token({"sub": str(user.id)})

    credentials = type("Creds", (), {"credentials": token})()
    fetched = await auth_core.get_current_user(credentials, db=db_session)
    assert fetched.id == user.id

    with pytest.raises(Exception):
        await auth_core.require_admin(fetched)

    fetched.is_admin = True
    assert await auth_core.require_admin(fetched) is fetched


@pytest.mark.asyncio
async def test_get_db_context(async_session_maker):
    auth_core.sessionmaker = async_session_maker

    async def consume():
        async for session in auth_core.get_db():
            return session

    session = await consume()
    assert session is not None
