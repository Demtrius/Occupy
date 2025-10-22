from typing import Any

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.exc import OperationalError, ProgrammingError


class ErrorResponse(BaseModel):
    error: dict[str, Any]


class AppError(Exception):
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
    def __init__(
        self,
        message: str = "Resource not found",
        *,
        code: str = "not_found",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class Forbidden(AppError):
    def __init__(
        self,
        message: str = "Access forbidden",
        *,
        code: str = "forbidden",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class Validation(AppError):
    def __init__(
        self,
        message: str,
        *,
        code: str = "validation_error",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class Conflict(AppError):
    def __init__(
        self,
        message: str = "Resource conflict",
        *,
        code: str = "conflict",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


class RateLimited(AppError):
    def __init__(
        self,
        message: str = "Too many requests",
        *,
        code: str = "rate_limited",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, details=details)


def _build_error_payload(exc: AppError) -> dict[str, Any]:
    return {"code": exc.code, "message": exc.message, "details": exc.details}


def not_found_handler(request: Request, exc: NotFound) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(error=_build_error_payload(exc)).model_dump(),
    )


def forbidden_handler(request: Request, exc: Forbidden) -> JSONResponse:
    return JSONResponse(
        status_code=403,
        content=ErrorResponse(error=_build_error_payload(exc)).model_dump(),
    )


def validation_handler(request: Request, exc: Validation) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(error=_build_error_payload(exc)).model_dump(),
    )


def conflict_handler(request: Request, exc: Conflict) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content=ErrorResponse(error=_build_error_payload(exc)).model_dump(),
    )


def rate_limited_handler(request: Request, exc: RateLimited) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content=ErrorResponse(error=_build_error_payload(exc)).model_dump(),
    )


def operational_error_handler(request: Request, exc: OperationalError) -> JSONResponse:
    payload = ErrorResponse(
        error={
            "code": "database_error",
            "message": "Database operation failed",
            "details": {},
        }
    ).model_dump()
    return JSONResponse(status_code=500, content=payload)


def programming_error_handler(request: Request, exc: ProgrammingError) -> JSONResponse:
    payload = ErrorResponse(
        error={
            "code": "database_error",
            "message": "Database programming error",
            "details": {},
        }
    ).model_dump()
    return JSONResponse(status_code=500, content=payload)


def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    payload = ErrorResponse(
        error={"code": "http_error", "message": exc.detail, "details": {}}
    ).model_dump()
    return JSONResponse(status_code=exc.status_code, content=payload)
