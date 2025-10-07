"""
Utility functions for the core app.
"""

from typing import Any, Dict, Optional
from rest_framework.response import Response
from rest_framework import status


def api_response(
    data: Any = None,
    message: str = "",
    success: bool = True,
    status_code: int = status.HTTP_200_OK,
    errors: Optional[Dict[str, Any]] = None,
    meta: Optional[Dict[str, Any]] = None,
) -> Response:
    """
    Standardized API response format.

    Args:
        data: The main response data
        message: Success or error message
        success: Whether the request was successful
        status_code: HTTP status code
        errors: Validation or other errors
        meta: Additional metadata (e.g., pagination info)

    Returns:
        Response object with standardized format
    """
    response_data = {
        "success": success,
        "message": message,
    }

    if data is not None:
        response_data["data"] = data

    if errors:
        response_data["errors"] = errors

    if meta:
        response_data["meta"] = meta

    return Response(response_data, status=status_code)


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = status.HTTP_200_OK,
    meta: Optional[Dict[str, Any]] = None,
) -> Response:
    """Helper for successful responses."""
    return api_response(
        data=data,
        message=message,
        success=True,
        status_code=status_code,
        meta=meta,
    )


def error_response(
    message: str = "Error",
    status_code: int = status.HTTP_400_BAD_REQUEST,
    errors: Optional[Dict[str, Any]] = None,
) -> Response:
    """Helper for error responses."""
    return api_response(
        message=message,
        success=False,
        status_code=status_code,
        errors=errors,
    )