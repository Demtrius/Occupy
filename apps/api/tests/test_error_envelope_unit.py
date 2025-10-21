from fastapi import HTTPException
from fastapi.testclient import TestClient
from starlette.requests import Request

from app.core import errors


def _dummy_request() -> Request:
    return Request({"type": "http", "method": "GET", "path": "/"})


def test_http_exception_handler_wraps_detail():
    request = _dummy_request()
    response = errors.http_exception_handler(
        request, HTTPException(status_code=401, detail="Invalid")
    )
    assert response.status_code == 401
    payload = response.body.decode()
    assert "http_error" in payload
    assert "Invalid" in payload


def test_conflict_handler_shape():
    request = _dummy_request()
    response = errors.conflict_handler(request, errors.Conflict())
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "conflict"
