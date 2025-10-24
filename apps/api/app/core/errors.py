import logging
from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.schemas.base import BaseSchema
from sqlalchemy.exc import IntegrityError, OperationalError, ProgrammingError


class ErrorResponse(BaseSchema):
    error: dict[str, Any]


class AppError(Exception):
    status_code = 400

    """Base error that carries code/message/details for the response envelope."""

    def __init__(
        self,
        message: str,
        *,
        code: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(message)


class NotFound(AppError):
    status_code = 404

    def __init__(
        self,
        message: str = "Resource not found",
        *,
        code: str = "not_found",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class Forbidden(AppError):
    status_code = 403

    def __init__(
        self,
        message: str = "Access forbidden",
        *,
        code: str = "forbidden",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class Validation(AppError):
    status_code = 400

    def __init__(
        self,
        message: str,
        *,
        code: str = "validation_error",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class Conflict(AppError):
    status_code = 409

    def __init__(
        self,
        message: str = "Resource conflict",
        *,
        code: str = "conflict",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class RateLimited(AppError):
    status_code = 429

    def __init__(
        self,
        message: str = "Too many requests",
        *,
        code: str = "rate_limited",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class Unauthorized(AppError):
    status_code = 401

    def __init__(
        self,
        message: str = "Unauthorized",
        *,
        code: str = "unauthorized",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


def _build_error_payload(exc: AppError) -> dict[str, Any]:
    return {"code": exc.code, "message": exc.message, "details": exc.details}


def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Render an ErrorEnvelope-compatible payload for application errors."""
    headers: dict[str, str] | None = None
    if getattr(exc, "status_code", 400) == 401:
        headers = {"WWW-Authenticate": "Bearer"}
    return JSONResponse(
        status_code=getattr(exc, "status_code", 400),
        content=ErrorResponse(error=_build_error_payload(exc)).model_dump(
            by_alias=True
        ),
        headers=headers,
    )


def not_found_handler(request: Request, exc: NotFound) -> JSONResponse:
    return app_error_handler(request, exc)


def forbidden_handler(request: Request, exc: Forbidden) -> JSONResponse:
    return app_error_handler(request, exc)


def validation_handler(request: Request, exc: Validation) -> JSONResponse:
    return app_error_handler(request, exc)


def conflict_handler(request: Request, exc: Conflict) -> JSONResponse:
    return app_error_handler(request, exc)


def rate_limited_handler(request: Request, exc: RateLimited) -> JSONResponse:
    return app_error_handler(request, exc)


def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    logging.error(f"Database integrity error: {exc}")
    message = str(getattr(exc, "orig", exc))
    message_lower = message.lower()
    if "uq_reviews_booking_id" in message_lower:
        payload = ErrorResponse(
            error={
                "code": "validation_error",
                "message": "Review already exists",
                "details": {},
            }
        ).model_dump(by_alias=True)
        return JSONResponse(status_code=400, content=payload)
    payload = ErrorResponse(
        error={
            "code": "validation_error",
            "message": "Integrity constraint violated",
            "details": {},
        }
    ).model_dump(by_alias=True)
    return JSONResponse(status_code=400, content=payload)


def operational_error_handler(request: Request, exc: OperationalError) -> JSONResponse:
    logging.error(f"Database operational error: {exc}")
    payload = ErrorResponse(
        error={
            "code": "database_error",
            "message": "Database operation failed",
            "details": {},
        }
    ).model_dump(by_alias=True)
    return JSONResponse(status_code=500, content=payload)


def programming_error_handler(request: Request, exc: ProgrammingError) -> JSONResponse:
    logging.error(f"Database programming error: {exc}")
    payload = ErrorResponse(
        error={
            "code": "database_error",
            "message": "Database programming error",
            "details": {},
        }
    ).model_dump(by_alias=True)
    return JSONResponse(status_code=500, content=payload)


def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Normalize raw HTTPExceptions into the standard error envelope."""
    payload = ErrorResponse(
        error={"code": "http_error", "message": exc.detail, "details": {}}
    ).model_dump(by_alias=True)
    return JSONResponse(status_code=exc.status_code, content=payload)


def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Normalize RequestValidationError into the standard error envelope."""
    payload = ErrorResponse(
        error={
            "code": "validation_error",
            "message": "Request validation failed",
            "details": {"errors": exc.errors()},
        }
    ).model_dump(by_alias=True)
    return JSONResponse(status_code=422, content=payload)
