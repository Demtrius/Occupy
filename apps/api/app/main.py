import os

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy.exc import IntegrityError, OperationalError, ProgrammingError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from .api.routes.auth import router as auth_router
from .api.routes.availability import router as availability_router
from .api.routes.bookings import router as bookings_router
from .api.routes.chats import router as chats_router
from .api.routes.cliques import router as cliques_router
from .api.routes.follows import router as follows_router
from .api.routes.media import router as media_router
from .api.routes.messages import router as messages_router
from .api.routes.notifications import router as notifications_router
from .api.routes.occupations import router as occupations_router
from .api.routes.posts import router as posts_router
from .api.routes.reviews import router as reviews_router
from .api.routes.search import router as search_router
from .api.routes.services import router as services_router
from .api.routes.slots import router as slots_router
from .api.routes.users import router as users_router
from .api.ws import router as ws_router
from .core import auth
from .core.errors import (
    AppError,
    app_error_handler,
    http_exception_handler,
    integrity_error_handler,
    operational_error_handler,
    programming_error_handler,
    validation_error_handler,
)
from .core.limiter import limiter

DATABASE_URL = os.environ.get(
    "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/clique"
)
engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)

# Set sessionmaker
auth_sessionmaker = async_session
deps_sessionmaker = async_session
auth.sessionmaker = async_session

APP_TITLE = "Occupy API"
APP_DESC = """
API for a social + bookings platform for small businesses.

- **Auth**: JWT Bearer (`Authorization: Bearer <token>`)
- **Pagination**: Cursor-based via `cursor` and `limit` query params; responses include `items[]` and `nextCursor`.
- **Errors**: Standardized envelope `{ "error": { "code", "message", "details" } }`.

See **/redoc** for a compact reference.
"""
APP_VERSION = "0.1.0"

app = FastAPI(
    title=APP_TITLE,
    description=APP_DESC,
    version=APP_VERSION,
    contact={
        "name": "Clique Devs",
        "url": "https://example.com",
        "email": "dev@example.com",
    },
    license_info={"name": "MIT"},
    terms_of_service="https://example.com/terms",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.openapi_tags = [
    {"name": "Auth", "description": "Login, register, refresh, logout."},
    {"name": "Users", "description": "Profiles, follows, blocks."},
    {"name": "Occupations", "description": "Taxonomy and assignments."},
    {"name": "Cliques", "description": "Business hubs, membership, invites, feed."},
    {"name": "Posts", "description": "Posts, media attachments, likes, comments."},
    {"name": "Media", "description": "Presigned uploads and media registration."},
    {"name": "Services", "description": "Business services CRUD."},
    {
        "name": "Availability",
        "description": "One-off and recurring availability windows.",
    },
    {"name": "Slots", "description": "Computed bookable time slots."},
    {
        "name": "Bookings",
        "description": "Booking lifecycle: create, confirm, cancel, reschedule.",
    },
    {"name": "Reviews", "description": "Booking reviews and averages."},
    {"name": "Notifications", "description": "In-app notifications."},
    {
        "name": "Search",
        "description": "Global search across users, occupations, cliques.",
    },
    {"name": "Messaging", "description": "Chats and messages."},
    {"name": "Health", "description": "Health checks."},
]

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Idempotency-Key"],
)

# Exception handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(OperationalError, operational_error_handler)
app.add_exception_handler(ProgrammingError, programming_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)

# Limiter
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    schema.setdefault("components", {}).setdefault("securitySchemes", {})[
        "BearerAuth"
    ] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }
    comps = schema["components"].setdefault("schemas", {})
    comps["ErrorEnvelope"] = {
        "type": "object",
        "required": ["error"],
        "properties": {
            "error": {
                "type": "object",
                "required": ["code", "message", "details"],
                "properties": {
                    "code": {"type": "string", "example": "validation_error"},
                    "message": {"type": "string", "example": "Invalid parent comment"},
                    "details": {
                        "type": "object",
                        "additionalProperties": True,
                        "example": {},
                    },
                },
            }
        },
    }
    params = schema["components"].setdefault("parameters", {})
    params["CursorParam"] = {
        "name": "cursor",
        "in": "query",
        "required": False,
        "schema": {"type": "string"},
        "description": "Opaque pagination cursor from previous response `nextCursor`.",
    }
    params["LimitParam"] = {
        "name": "limit",
        "in": "query",
        "required": False,
        "schema": {"type": "integer", "default": 20, "maximum": 100, "minimum": 1},
        "description": "Max items to return (default 20, max 100).",
    }
    headers = schema["components"].setdefault("headers", {})
    headers["X-RateLimit-Limit"] = {
        "schema": {"type": "integer"},
        "description": "Request limit for the window.",
    }
    headers["X-RateLimit-Remaining"] = {
        "schema": {"type": "integer"},
        "description": "Requests left in the window.",
    }
    headers["X-RateLimit-Reset"] = {
        "schema": {"type": "integer"},
        "description": "Seconds until reset.",
    }

    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi

# Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(follows_router)
app.include_router(cliques_router)
app.include_router(posts_router)
app.include_router(media_router)
app.include_router(bookings_router)
app.include_router(reviews_router)
app.include_router(notifications_router)
app.include_router(search_router)
app.include_router(chats_router)
app.include_router(messages_router)
app.include_router(occupations_router)
app.include_router(services_router)
app.include_router(availability_router)
app.include_router(slots_router)

# WebSocket routes
app.include_router(ws_router, prefix="/ws")


health_router = APIRouter(prefix="/api/v1", tags=["Health"])


@health_router.get(
    "/health",
    summary="Health check",
    description="Simple liveness probe.",
    response_model=dict[str, str],
    operation_id="HealthCheck",
)
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(health_router)
