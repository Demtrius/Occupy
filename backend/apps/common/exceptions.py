"""
Custom exceptions for the application.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError


class CustomAPIException(Exception):
    """Base custom API exception."""

    default_message = "An error occurred"
    default_code = "error"
    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, message=None, code=None, status_code=None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        if status_code:
            self.status_code = status_code
        super().__init__(self.message)


class ValidationError(CustomAPIException):
    """Custom validation error."""

    default_message = "Validation failed"
    default_code = "validation_error"
    status_code = status.HTTP_400_BAD_REQUEST


class PermissionDeniedError(CustomAPIException):
    """Custom permission denied error."""

    default_message = "Permission denied"
    default_code = "permission_denied"
    status_code = status.HTTP_403_FORBIDDEN


class NotFoundError(CustomAPIException):
    """Custom not found error."""

    default_message = "Resource not found"
    default_code = "not_found"
    status_code = status.HTTP_404_NOT_FOUND


class ConflictError(CustomAPIException):
    """Custom conflict error."""

    default_message = "Resource conflict"
    default_code = "conflict"
    status_code = status.HTTP_409_CONFLICT


class RateLimitError(CustomAPIException):
    """Custom rate limit error."""

    default_message = "Rate limit exceeded"
    default_code = "rate_limit_exceeded"
    status_code = status.HTTP_429_TOO_MANY_REQUESTS


class ServiceUnavailableError(CustomAPIException):
    """Custom service unavailable error."""

    default_message = "Service temporarily unavailable"
    default_code = "service_unavailable"
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # Handle custom API exceptions
    if isinstance(exc, CustomAPIException):
        custom_response_data = {
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
            },
        }
        return Response(custom_response_data, status=exc.status_code)

    # Handle Django validation errors
    if isinstance(exc, DjangoValidationError):
        custom_response_data = {
            "success": False,
            "error": {
                "code": "validation_error",
                "message": "Validation failed",
                "details": (
                    exc.message_dict if hasattr(exc, "message_dict") else str(exc)
                ),
            },
        }
        return Response(custom_response_data, status=status.HTTP_400_BAD_REQUEST)

    # Customize the response format for other exceptions
    if response is not None:
        custom_response_data = {
            "success": False,
            "error": {
                "code": "error",
                "message": "An error occurred",
            },
        }

        # Extract error details from the original response
        if isinstance(response.data, dict):
            if "detail" in response.data:
                custom_response_data["error"]["message"] = response.data["detail"]
            elif "non_field_errors" in response.data:
                custom_response_data["error"]["message"] = response.data[
                    "non_field_errors"
                ][0]
            else:
                # Include field-specific errors
                custom_response_data["error"]["details"] = response.data

        response.data = custom_response_data

    return response
