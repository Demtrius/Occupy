from __future__ import annotations

from typing import Any, Iterable


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def assert_error(response, code: str) -> None:
    assert response.status_code >= 400
    payload = response.json()
    assert "error" in payload, payload
    error = payload["error"]
    assert error["code"] == code
    assert "message" in error
    assert "details" in error
    assert isinstance(error["details"], dict)


def assert_cursor_page(payload: dict[str, Any], key: str = "items") -> None:
    assert key in payload
    assert isinstance(payload[key], list)
    assert "nextCursor" in payload


def pick(sliceable: Iterable, count: int) -> list[Any]:
    return list(sliceable)[:count]
