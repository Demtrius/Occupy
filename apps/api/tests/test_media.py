import pytest

from tests.factories import create_user
from tests.utils import assert_error, auth_headers


@pytest.mark.asyncio
async def test_presign_and_register_media(client, db_session, make_token):
    user = await create_user(db_session)
    await db_session.commit()

    headers = auth_headers(make_token(user))
    presign_response = await client.post(
        "/api/v1/media/uploads/presign",
        params={"mime": "image/jpeg", "size_bytes": 512, "purpose": "avatar"},
        headers=headers,
    )
    assert presign_response.status_code == 200
    upload = presign_response.json()
    assert upload["method"] == "PUT"
    assert upload["upload_url"].startswith("http")

    register_response = await client.post(
        "/api/v1/media",
        json={
            "url": "https://uploads.test/avatar.jpg",
            "mime": "image/jpeg",
            "size_bytes": 512,
            "meta": {"purpose": "avatar"},
        },
        headers=headers,
    )
    assert register_response.status_code == 200
    assert "media_id" in register_response.json()


@pytest.mark.asyncio
async def test_presign_rejects_large_payload(client, db_session, make_token):
    user = await create_user(db_session)
    await db_session.commit()

    response = await client.post(
        "/api/v1/media/uploads/presign",
        params={"mime": "application/pdf", "size_bytes": 20_000_000, "purpose": "doc"},
        headers=auth_headers(make_token(user)),
    )
    assert response.status_code == 400
    assert_error(response, "validation_error")
