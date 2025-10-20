from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from .api.routes.auth import router as auth_router
from .api.routes.availability import router as availability_router
from .api.routes.bookings import router as bookings_router
from .api.routes.business_services import router as business_services_router
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
from .api.routes.users import router as users_router
from .api.ws import router as ws_router
from .core.errors import (
    Conflict,
    Forbidden,
    NotFound,
    RateLimited,
    Validation,
    conflict_handler,
    forbidden_handler,
    http_exception_handler,
    not_found_handler,
    rate_limited_handler,
    validation_handler,
)
from .core.limiter import limiter

# Database setup (placeholder)
DATABASE_URL = "postgresql+asyncpg://user:password@localhost/db"
engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)

# Set sessionmaker
auth_sessionmaker = async_session
deps_sessionmaker = async_session

app = FastAPI(title="Occupy API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["Authorization", "Idempotency-Key"],
)

# Exception handlers
app.add_exception_handler(NotFound, not_found_handler)
app.add_exception_handler(Forbidden, forbidden_handler)
app.add_exception_handler(Validation, validation_handler)
app.add_exception_handler(Conflict, conflict_handler)
app.add_exception_handler(RateLimited, rate_limited_handler)
app.add_exception_handler(500, http_exception_handler)

# Limiter
limiter.init_app(app)

# Routers
app.include_router(auth_router, prefix="/api/v1")


app.include_router(users_router, prefix="/api/v1")
app.include_router(follows_router, prefix="/api/v1")
app.include_router(cliques_router, prefix="/api/v1")
app.include_router(posts_router, prefix="/api/v1")
app.include_router(media_router, prefix="/api/v1")
app.include_router(bookings_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(chats_router, prefix="/api/v1")
app.include_router(messages_router, prefix="/api/v1")
app.include_router(occupations_router, prefix="/api/v1")
app.include_router(business_services_router, prefix="/api/v1")
app.include_router(availability_router, prefix="/api/v1")

# WebSocket routes

app.include_router(ws_router, prefix="/ws")


@app.get("/health")
async def health():
    return {"status": "ok"}
