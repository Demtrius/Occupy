from __future__ import annotations

from http import HTTPStatus
from typing import Any, Mapping

ERROR_CONTENT = {
    "application/json": {"schema": {"$ref": "#/components/schemas/ErrorEnvelope"}}
}


def error_responses(
    *statuses: int, descriptions: Mapping[int, str] | None = None
) -> dict[int, dict[str, Any]]:
    """
    Build a FastAPI responses mapping that reuses the standard error envelope.
    """

    responses: dict[int, dict[str, Any]] = {}
    for status in statuses:
        if descriptions and status in descriptions:
            description = descriptions[status]
        else:
            try:
                description = HTTPStatus(status).phrase
            except ValueError:
                description = ""
        responses[status] = {"description": description, "content": ERROR_CONTENT}
    return responses


def pagination_parameters() -> dict[str, Any]:
    """
    Reference the shared cursor pagination parameters in operation docs.
    """

    return {
        "parameters": [
            {"$ref": "#/components/parameters/CursorParam"},
            {"$ref": "#/components/parameters/LimitParam"},
        ]
    }


def secured(extra: dict[str, Any] | None = None) -> dict[str, Any]:
    """
    Document bearer security for an operation, optionally merging additional extras.
    """

    payload: dict[str, Any] = {"security": [{"BearerAuth": []}]}
    if extra:
        payload.update(extra)
    return payload


def combine_openapi_extra(*extras: dict[str, Any] | None) -> dict[str, Any]:
    """
    Merge multiple openapi_extra dictionaries, keeping parameter lists additive.
    """

    merged: dict[str, Any] = {}
    for extra in extras:
        if not extra:
            continue
        for key, value in extra.items():
            if key == "parameters":
                merged.setdefault("parameters", [])
                merged["parameters"].extend(value)
            else:
                merged[key] = value
    return merged
