from __future__ import annotations

import json

from fastapi import HTTPException
from starlette.requests import Request

from app.core import errors


def _dummy_request() -> Request:
    return Request({"type": "http", "method": "GET", "path": "/"})


def test_http_exception_handler_wraps_detail():
    request = _dummy_request()
    response = errors.http_exception_handler(
        request, HTTPException(status_code=401, detail="Invalid")
    )
    payload = json.loads(response.body)
    assert payload["error"]["code"] == "http_error"
    assert payload["error"]["message"] == "Invalid"


def test_conflict_handler_shape():
    request = _dummy_request()
    response = errors.conflict_handler(request, errors.Conflict())
    payload = json.loads(response.body)
    assert payload["error"]["code"] == "conflict"


def test_other_handlers():
    request = _dummy_request()
    assert errors.not_found_handler(request, errors.NotFound()).status_code == 404
    assert errors.forbidden_handler(request, errors.Forbidden()).status_code == 403
    assert errors.rate_limited_handler(request, errors.RateLimited()).status_code == 429
    validation = errors.validation_handler(request, errors.Validation("bad"))
    payload = json.loads(validation.body)
    assert payload["error"]["code"] == "validation_error"
