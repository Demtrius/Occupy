from typing import Dict

import httpx

from app.core.auth import create_access_token
from app.models.user import User


def auth_headers(user: User) -> Dict[str, str]:
    """Generate authorization headers for a user."""
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


def assert_error(resp: httpx.Response, code: str) -> None:
    """Assert that response is an error with the given code."""
    assert resp.status_code in (400, 401, 403, 404, 409, 422, 429, 500)
    data = resp.json()
    assert "error" in data
    assert data["error"]["code"] == code


def assert_success(resp: httpx.Response) -> None:
    """Assert that response is successful (200)."""
    assert resp.status_code == 200


def assert_cursor_list(resp: httpx.Response, key: str = "items") -> None:
    """Assert that response is a cursor-paginated list."""
    assert resp.status_code == 200
    data = resp.json()
    assert key in data
    assert isinstance(data[key], list)
    # Check for cursor fields
    assert "nextCursor" in data
    # nextCursor can be null or string
