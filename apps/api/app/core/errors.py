from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    error: dict


class NotFound(Exception):
    pass


class Forbidden(Exception):
    pass


class Validation(Exception):
    def __init__(self, message: str):
        self.message = message


class Conflict(Exception):
    pass


class RateLimited(Exception):
    pass


def not_found_handler(request: Request, exc: NotFound) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(error={"code": "not_found", "message": "Resource not found"}).model_dump(),
    )


def forbidden_handler(request: Request, exc: Forbidden) -> JSONResponse:
    return JSONResponse(
        status_code=403,
        content=ErrorResponse(error={"code": "forbidden", "message": "Access forbidden"}).model_dump(),
    )


def validation_handler(request: Request, exc: Validation) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content=ErrorResponse(error={"code": "validation_error", "message": exc.message}).model_dump(),
    )


def conflict_handler(request: Request, exc: Conflict) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content=ErrorResponse(error={"code": "conflict", "message": "Resource conflict"}).model_dump(),
    )


def rate_limited_handler(request: Request, exc: RateLimited) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content=ErrorResponse(error={"code": "rate_limited", "message": "Too many requests"}).model_dump(),
    )


def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(error={"code": "http_error", "message": exc.detail}).model_dump(),
    )