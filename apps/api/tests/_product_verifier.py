from __future__ import annotations

import asyncio
import os
import sys
from collections.abc import Awaitable, Callable
from contextlib import AsyncExitStack, ExitStack
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from itertools import count
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import httpx
from alembic import command
from alembic.config import Config
from asgi_lifespan import LifespanManager
from httpx import ASGITransport
from starlette.testclient import TestClient
from minio import Minio
from redis.asyncio import Redis
from sqlalchemy import make_url, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool
from testcontainers.minio import MinioContainer
from testcontainers.postgres import PostgresContainer
from testcontainers.redis import RedisContainer


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.core.auth import (
    create_access_token,
    create_refresh_token,
)
from app.core.limiter import limiter
from app.models.enums import MembershipStatus, Role
from app.db.base import Base
from app.models.post import Comment
from app.models.booking import Booking, BookingStatus
from app.models.chat import Chat, Message
from app.models.clique import CliqueMember
from app.models.user import CliqueOccupation, Occupation, UserOccupation
from tests.factories import create_user as factory_create_user
from tests.utils import assert_cursor_page, auth_headers


REPORT_PATH = BASE_DIR / "REPORT.md"
ALEMBIC_INI = BASE_DIR / "alembic.ini"
MIGRATIONS_DIR = BASE_DIR / "alembic"

_USER_SEQ = count(1)


def _unique_name(prefix: str = "user") -> str:
    return f"{prefix}{next(_USER_SEQ)}"


@dataclass
class RegisteredUser:
    id: str
    username: str
    access_token: str
    refresh_token: str
    payload: dict[str, Any]

    def headers(self) -> dict[str, str]:
        return auth_headers(self.access_token)


@dataclass
class ScenarioDefinition:
    key: str
    category: str
    handler: Callable[["VerifierContext"], Awaitable[None]]


@dataclass
class ScenarioResult:
    key: str
    category: str
    passed: bool
    note: str = "-"


@dataclass
class VerifierContext:
    client: httpx.AsyncClient
    sessionmaker: async_sessionmaker[AsyncSession]
    redis: Redis
    engine: Any
    sync_client: TestClient | None = None
    auth_http_enabled: bool = field(default=True)

    async def reset_state(self) -> None:
        table_names = _table_names()
        if table_names:
            async with self.sessionmaker() as session:
                await session.execute(
                    text(f"TRUNCATE {', '.join(table_names)} RESTART IDENTITY CASCADE")
                )
                await session.commit()
        await self.redis.flushdb()

    def disable_auth_http(self) -> None:
        self.auth_http_enabled = False

    async def create_user_direct(
        self,
        *,
        username: str,
        email: str,
        password: str,
        is_business_page: bool = False,
        is_private_account: bool = False,
        is_admin: bool = False,
        is_active: bool = True,
    ) -> RegisteredUser:
        async with self.sessionmaker() as session:
            user = await factory_create_user(
                session,
                email=email,
                username=username,
                password=password,
                is_business_page=is_business_page,
                is_private_account=is_private_account,
                is_admin=is_admin,
                is_active=is_active,
            )
            await session.commit()
            await session.refresh(user)

        payload = {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "is_business_page": user.is_business_page,
            "is_private_account": user.is_private_account,
            "is_admin": user.is_admin,
            "is_active": user.is_active,
        }
        access_token = create_access_token({"sub": payload["id"]})
        refresh_token, _, _ = create_refresh_token({"sub": payload["id"]})
        return RegisteredUser(
            id=payload["id"],
            username=payload["username"],
            access_token=access_token,
            refresh_token=refresh_token,
            payload=payload,
        )


def _table_names() -> list[str]:
    return [
        table.name
        for table in Base.metadata.sorted_tables
        if table.name != "alembic_version"
    ]


async def _wait_for_redis(client: Redis, retries: int = 10, delay: float = 0.5) -> None:
    for attempt in range(retries):
        try:
            await client.ping()
            return
        except Exception:
            if attempt == retries - 1:
                raise
            await asyncio.sleep(delay)


def configure_environment(
    database_url: str,
    redis_url: str,
    minio_settings: dict[str, Any],
) -> None:
    os.environ["DATABASE_URL"] = database_url
    os.environ["REDIS_URL"] = redis_url
    os.environ["MINIO_ENDPOINT"] = minio_settings["endpoint"]
    os.environ["MINIO_ACCESS_KEY"] = minio_settings["access_key"]
    os.environ["MINIO_SECRET_KEY"] = minio_settings["secret_key"]
    os.environ["MINIO_BUCKET"] = minio_settings["bucket"]
    os.environ["MINIO_USE_SSL"] = "false"
    os.environ.setdefault("JWT_SECRET", "test-secret")


def run_migrations(postgres: PostgresContainer) -> None:
    cfg = Config(str(ALEMBIC_INI))
    cfg.set_main_option("script_location", str(MIGRATIONS_DIR))
    cfg.set_main_option(
        "sqlalchemy.url",
        str(
            make_url(postgres.get_connection_url()).set(drivername="postgresql+asyncpg")
        ),
    )
    command.upgrade(cfg, "head")


async def bootstrap_infrastructure() -> (
    tuple[VerifierContext, AsyncExitStack, ExitStack]
):
    sync_stack = ExitStack()
    postgres = sync_stack.enter_context(
        PostgresContainer("postgres:16").with_env("POSTGRES_HOST_AUTH_METHOD", "trust")
    )
    redis = sync_stack.enter_context(RedisContainer("redis:7"))
    minio = sync_stack.enter_context(
        MinioContainer("minio/minio:RELEASE.2024-08-03T04-33-23Z")
        .with_env("MINIO_ROOT_USER", "minioadmin")
        .with_env("MINIO_ROOT_PASSWORD", "minioadmin")
    )

    database_url = str(
        make_url(postgres.get_connection_url()).set(drivername="postgresql+asyncpg")
    )
    redis_host = redis.get_container_host_ip()
    redis_port = redis.get_exposed_port(6379)
    redis_url = f"redis://{redis_host}:{redis_port}/0"
    minio_host = minio.get_container_host_ip()
    minio_port = minio.get_exposed_port(9000)
    minio_settings = {
        "endpoint": f"http://{minio_host}:{minio_port}",
        "access_key": "minioadmin",
        "secret_key": "minioadmin",
        "bucket": "occupy-product-verifier",
    }

    minio_client = Minio(
        f"{minio_host}:{minio_port}",
        access_key=minio_settings["access_key"],
        secret_key=minio_settings["secret_key"],
        secure=False,
    )
    if not minio_client.bucket_exists(minio_settings["bucket"]):
        minio_client.make_bucket(minio_settings["bucket"])

    configure_environment(database_url, redis_url, minio_settings)
    await asyncio.to_thread(run_migrations, postgres)

    engine = create_async_engine(database_url, poolclass=NullPool)
    sessionmaker = async_sessionmaker(engine, expire_on_commit=False)

    async_stack = AsyncExitStack()
    from app import main as app_module
    from app.core import auth as auth_core

    app_module.engine = engine
    app_module.async_session = sessionmaker
    app_module.auth_sessionmaker = sessionmaker
    app_module.deps_sessionmaker = sessionmaker
    auth_core.sessionmaker = sessionmaker
    limiter.enabled = False

    lifespan = LifespanManager(app_module.app)
    await async_stack.enter_async_context(lifespan)
    client = await async_stack.enter_async_context(
        httpx.AsyncClient(
            transport=ASGITransport(app=app_module.app), base_url="http://test"
        )
    )
    sync_client = sync_stack.enter_context(
        TestClient(app_module.app, base_url="http://test")
    )

    redis_client = Redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    await _wait_for_redis(redis_client)

    ctx = VerifierContext(
        client=client,
        sessionmaker=sessionmaker,
        redis=redis_client,
        engine=engine,
        sync_client=sync_client,
    )
    return ctx, async_stack, sync_stack


async def request_json(
    ctx: VerifierContext,
    method: str,
    url: str,
    *,
    user: RegisteredUser | None = None,
    expected_status: int | None = 200,
    **kwargs: Any,
) -> tuple[httpx.Response, Any | None]:
    headers = kwargs.pop("headers", {})
    if user is not None:
        headers.update(user.headers())
    response = await ctx.client.request(method, url, headers=headers, **kwargs)
    data: Any | None = None
    if response.headers.get("content-type", "").startswith("application/json"):
        try:
            data = response.json()
        except ValueError as exc:  # pragma: no cover - diagnostic
            body_preview = response.text[:200]
            raise AssertionError(
                f"{method} {url} returned invalid JSON payload: {body_preview}"
            ) from exc
    if expected_status is not None:
        assert (
            response.status_code == expected_status
        ), f"{method} {url} expected {expected_status}, got {response.status_code}: {response.text}"
    return response, data


def assert_error_envelope(payload: dict[str, Any], code: str) -> None:
    error = payload.get("error")
    assert (
        error and error.get("code") == code
    ), f"Expected error code {code}, got {payload}"


async def ensure_membership_status(
    ctx: VerifierContext,
    clique_id: str,
    owner: RegisteredUser,
    expected_status: str,
) -> None:
    resp, data = await request_json(
        ctx,
        "GET",
        f"/api/v1/cliques/{clique_id}/members",
        user=owner,
    )
    assert data and any(
        member["status"] == expected_status for member in data.get("items", [])
    ), f"Membership status {expected_status} not found in {data}"


async def register_user(
    ctx: VerifierContext,
    *,
    username: str | None = None,
    email: str | None = None,
    password: str = "Passw0rd!",
    is_business_page: bool = False,
    is_private_account: bool = False,
    is_admin: bool = False,
    is_active: bool = True,
    require_http: bool = False,
) -> RegisteredUser:
    username = username or _unique_name()
    email = email or f"{username}@example.com"
    payload = {
        "email": email,
        "username": username,
        "password": password,
        "full_name": f"{username.title()} Example",
        "bio": "Automated verifier user",
        "profile_image_url": None,
        "is_business_page": is_business_page,
        "is_private_account": is_private_account,
        "is_admin": is_admin,
        "is_active": is_active,
    }

    if ctx.auth_http_enabled or require_http:
        response = await ctx.client.post("/api/v1/auth/register", json=payload)
        if response.status_code == 201:
            data = response.json()
            user_data = data["user"]
            return RegisteredUser(
                id=user_data["id"],
                username=user_data["username"],
                access_token=data["access_token"],
                refresh_token=data["refresh_token"],
                payload=user_data,
            )
        ctx.disable_auth_http()
        if require_http:
            raise AssertionError(
                f"HTTP registration failed ({response.status_code}): {response.text}"
            )

    return await ctx.create_user_direct(
        username=username,
        email=email,
        password=password,
        is_business_page=is_business_page,
        is_private_account=is_private_account,
        is_admin=is_admin,
        is_active=is_active,
    )


async def run_scenario(
    ctx: VerifierContext, scenario: ScenarioDefinition
) -> ScenarioResult:
    try:
        await ctx.reset_state()
    except Exception as exc:
        return ScenarioResult(
            scenario.key, scenario.category, False, f"Reset failed: {exc}"
        )

    try:
        await scenario.handler(ctx)
        return ScenarioResult(scenario.key, scenario.category, True, "-")
    except AssertionError as exc:
        return ScenarioResult(scenario.key, scenario.category, False, str(exc))
    except Exception as exc:  # pragma: no cover - defensive
        return ScenarioResult(
            scenario.key,
            scenario.category,
            False,
            f"{exc.__class__.__name__}: {exc}",
        )


def build_report(results: list[ScenarioResult]) -> tuple[str, bool]:
    category_order = [
        "Cross-cutting",
        "Privacy & relationships",
        "Social content",
        "Media",
        "Scheduling/Bookings",
        "Reviews",
        "Notifications",
        "Search",
        "Messaging & WS",
        "DB invariants",
    ]

    category_map: dict[str, list[ScenarioResult]] = {
        category: [] for category in category_order
    }
    for result in results:
        category_map.setdefault(result.category, []).append(result)

    lines = [
        "BACKEND PRODUCT VERIFICATION",
        "============================",
    ]

    any_fail = False
    hints: list[str] = []

    for category in category_order:
        entries = category_map.get(category, [])
        failures = [
            f"{entry.key}: {entry.note}" for entry in entries if not entry.passed
        ]
        category_pass = bool(entries) and not failures
        if not entries:
            failures.append(f"{category}: No scenarios executed")
        if failures:
            hints.extend(failures)
        state = "PASS" if category_pass else "FAIL"
        note = "-" if category_pass else "; ".join(failures)
        lines.append(f"{category}: {state} ({note})")
        if not category_pass:
            any_fail = True

    overall = "PASS" if not any_fail else "FAIL"
    lines.append("")
    lines.append(f"Overall: {overall}")
    if hints:
        lines.append("Hints: " + "; ".join(hints))
    else:
        lines.append("Hints: All mandatory scenarios passed")
    return "\n".join(lines) + "\n", not any_fail


def write_report(report: str) -> None:
    REPORT_PATH.write_text(report)


# Scenario implementations -------------------------------------------------


async def scenario_auth(ctx: VerifierContext) -> None:
    user = await register_user(ctx, username="alice", require_http=True)

    login_resp = await ctx.client.post(
        "/api/v1/auth/login",
        json={"email_or_username": user.username, "password": "Passw0rd!"},
    )
    if login_resp.status_code != 200:
        ctx.disable_auth_http()
    assert login_resp.status_code == 200, f"login returned {login_resp.status_code}"
    login_data = login_resp.json()
    new_access = login_data.get("access_token")
    new_refresh = login_data.get("refresh_token")
    assert new_access and new_refresh, "login tokens missing"

    refresh_resp = await ctx.client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": user.refresh_token},
    )
    assert refresh_resp.status_code == 200, "refresh failed"
    refreshed = refresh_resp.json()
    refreshed_access = refreshed.get("access_token")
    refreshed_refresh = refreshed.get("refresh_token")
    assert refreshed_access and refreshed_refresh, "refresh tokens missing"

    protected_resp = await ctx.client.get(
        "/api/v1/users/me",
        headers=auth_headers(refreshed_access),
    )
    assert protected_resp.status_code == 200, "authorized /users/me failed"

    unauthorized_resp = await ctx.client.get("/api/v1/users/me")
    assert (
        unauthorized_resp.status_code == 401
    ), f"expected 401, got {unauthorized_resp.status_code}"
    assert (
        unauthorized_resp.headers.get("WWW-Authenticate") == "Bearer"
    ), "WWW-Authenticate header missing"
    envelope = unauthorized_resp.json()
    assert (
        envelope.get("error", {}).get("code") == "unauthorized"
    ), "error code mismatch"

    logout_resp = await ctx.client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": refreshed_refresh},
        headers=auth_headers(refreshed_access),
    )
    assert logout_resp.status_code == 200, "logout failed"

    reuse_resp = await ctx.client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refreshed_refresh},
    )
    assert reuse_resp.status_code == 401, "revoked refresh token should fail"


async def scenario_users_and_follows(ctx: VerifierContext) -> None:
    follower = await register_user(ctx, username="follower")
    public_user = await register_user(ctx, username="public")
    private_user = await register_user(ctx, username="private", is_private_account=True)
    blocked_user = await register_user(ctx, username="blocked")
    bystander = await register_user(ctx, username="bystander")

    follow_resp = await ctx.client.post(
        f"/api/v1/users/{public_user.id}/follow",
        headers=follower.headers(),
    )
    assert follow_resp.status_code == 200, "public follow failed"
    assert follow_resp.json().get("status") == "accepted", "public follow not accepted"

    followers_resp = await ctx.client.get(
        f"/api/v1/users/{public_user.id}/follow/followers",
        headers=public_user.headers(),
    )
    assert followers_resp.status_code == 200, "list followers failed"
    payload = followers_resp.json()
    assert_cursor_page(payload)
    follower_ids = {row.get("follower_user_id") for row in payload.get("items", [])}
    assert follower.id in follower_ids, "follower missing from follower list"

    hidden_view = await ctx.client.get(
        f"/api/v1/users/{private_user.id}",
        headers=bystander.headers(),
    )
    assert hidden_view.status_code in {403, 404}, "private profile should be hidden"

    private_follow = await ctx.client.post(
        f"/api/v1/users/{private_user.id}/follow",
        headers=follower.headers(),
    )
    assert private_follow.status_code == 200, "private follow request failed"
    assert (
        private_follow.json().get("status") == "pending"
    ), "private follow not pending"

    pending_view = await ctx.client.get(
        f"/api/v1/users/{private_user.id}",
        headers=follower.headers(),
    )
    assert pending_view.status_code in {
        403,
        404,
    }, "pending follow should not grant access"

    approve_resp = await ctx.client.post(
        f"/api/v1/users/{follower.id}/follow/approve",
        headers=private_user.headers(),
    )
    assert approve_resp.status_code == 200, "approve failed"
    assert approve_resp.json().get("status") == "accepted", "approve not accepted"

    allowed_view = await ctx.client.get(
        f"/api/v1/users/{private_user.id}",
        headers=follower.headers(),
    )
    assert allowed_view.status_code == 200, "approved follower cannot view profile"

    block_resp = await ctx.client.post(
        f"/api/v1/users/{blocked_user.id}/follow/block",
        headers=private_user.headers(),
    )
    assert block_resp.status_code == 200, "block failed"

    blocked_view = await ctx.client.get(
        f"/api/v1/users/{private_user.id}",
        headers=blocked_user.headers(),
    )
    assert blocked_view.status_code in {
        403,
        404,
    }, "blocked user should not view profile"


async def scenario_cliques(ctx: VerifierContext) -> None:
    business = await register_user(ctx, username="clique_owner", is_business_page=True)
    member = await register_user(ctx, username="clique_member")
    outsider = await register_user(ctx, username="clique_outsider")

    non_business = await register_user(ctx, username="non_business")
    payload = {
        "name": "NonBiz Clique",
        "description": "Should fail",
        "privacy": "public",
        "timezone": "UTC",
        "occupation_ids": [],
        "cancellation_cutoff_hours": 24,
    }
    resp, data = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        user=non_business,
        json=payload,
        expected_status=None,
    )
    assert resp.status_code == 403, "Non-business user should not create cliques"
    assert data is not None
    assert_error_envelope(data, "forbidden")

    private_payload = payload | {"name": "Private Lounge", "privacy": "private"}
    _, private_clique = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        expected_status=201,
        user=business,
        json=private_payload,
    )
    private_id = private_clique["id"]

    resp, data = await request_json(
        ctx,
        "GET",
        f"/api/v1/cliques/{private_id}",
        user=outsider,
        expected_status=None,
    )
    assert (
        resp.status_code == 200
    ), f"Private clique metadata should be visible to outsiders (expected 200, got {resp.status_code})"
    assert data
    assert data["name"] == private_payload["name"]

    public_payload = payload | {"name": "Public Hub", "privacy": "public"}
    _, public_clique = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        expected_status=201,
        user=business,
        json=public_payload,
    )
    public_id = public_clique["id"]

    _, join_public = await request_json(
        ctx,
        "POST",
        f"/api/v1/cliques/{public_id}/join",
        user=member,
    )
    assert (
        join_public["status"].lower() == "joined"
    ), "Public clique join should be immediate"

    private_joiner = await register_user(ctx, username="private_joiner")
    _, private_join = await request_json(
        ctx,
        "POST",
        f"/api/v1/cliques/{private_id}/join",
        user=private_joiner,
    )
    assert (
        private_join["status"].lower() == "pending"
    ), "Private clique join should be pending"

    _, pending_list = await request_json(
        ctx,
        "GET",
        f"/api/v1/cliques/{private_id}/members/pending",
        user=business,
    )
    assert pending_list["items"], "Owner should see pending members"
    member_id = pending_list["items"][0]["id"]

    _, approved = await request_json(
        ctx,
        "POST",
        f"/api/v1/cliques/{private_id}/members/{member_id}/approve",
        user=business,
    )
    assert (
        approved["status"].lower() == "joined"
    ), "Owner approval should mark member joined"
    await ensure_membership_status(ctx, private_id, business, "joined")

    _, rejected = await request_json(
        ctx,
        "POST",
        f"/api/v1/cliques/{private_id}/members/{member_id}/reject",
        user=business,
    )
    assert rejected["status"] == "rejected", "Owner should be able to reject/ban member"

    resp, post_error = await request_json(
        ctx,
        "POST",
        f"/api/v1/posts/cliques/{private_id}/posts",
        user=member,
        json={"content": "Hi", "status": "posted"},
        expected_status=None,
    )
    assert resp.status_code == 403, "Only owner should create posts in clique"
    if post_error:
        assert_error_envelope(post_error, "forbidden")


async def scenario_posts(ctx: VerifierContext) -> None:
    owner = await register_user(ctx, username="posts_owner", is_business_page=True)
    member = await register_user(ctx, username="posts_member")

    _, clique = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        expected_status=201,
        user=owner,
        json={
            "name": "Content Club",
            "description": "Posts testing",
            "privacy": "public",
            "timezone": "UTC",
            "occupation_ids": [],
            "cancellation_cutoff_hours": 24,
        },
    )
    clique_id = clique["id"]

    await request_json(
        ctx,
        "POST",
        f"/api/v1/cliques/{clique_id}/join",
        user=member,
    )

    _, post = await request_json(
        ctx,
        "POST",
        f"/api/v1/posts/cliques/{clique_id}/posts",
        user=owner,
        json={"content": "# Update", "status": "posted"},
        expected_status=201,
    )
    post_id = post["id"]

    _, posts_list = await request_json(
        ctx,
        "GET",
        f"/api/v1/posts/cliques/{clique_id}/posts",
        user=owner,
    )
    assert posts_list["items"], "Listing posts should include created post"
    first = posts_list["items"][0]
    for key in ("likes_count", "comments_count", "liked_by_me"):
        assert key in first, f"Post listing missing {key}"

    _, like_payload = await request_json(
        ctx,
        "POST",
        f"/api/v1/posts/{post_id}/like",
        user=member,
    )
    assert like_payload["likes_count"] == 1, "First like should increment count"
    _, like_again = await request_json(
        ctx,
        "POST",
        f"/api/v1/posts/{post_id}/like",
        user=member,
    )
    assert like_again["likes_count"] == 1, "Like should be idempotent"
    _, unlike_payload = await request_json(
        ctx,
        "DELETE",
        f"/api/v1/posts/{post_id}/like",
        user=member,
    )
    assert unlike_payload["likes_count"] == 0, "Unlike should decrement"
    _, unlike_again = await request_json(
        ctx,
        "DELETE",
        f"/api/v1/posts/{post_id}/like",
        user=member,
    )
    assert unlike_again["likes_count"] == 0, "Unlike should be idempotent"

    _, comment = await request_json(
        ctx,
        "POST",
        f"/api/v1/posts/{post_id}/comments",
        user=member,
        json={"body": "Nice work"},
        expected_status=201,
    )
    comment_id = comment["id"]

    _, reply = await request_json(
        ctx,
        "POST",
        f"/api/v1/posts/{post_id}/comments",
        user=member,
        json={"body": "Reply", "parent_comment_id": comment_id},
        expected_status=201,
    )
    assert (
        reply["parent_comment_id"] == comment_id
    ), "Replies should link to parent comment"

    resp, _ = await request_json(
        ctx,
        "DELETE",
        f"/api/v1/posts/comments/{comment_id}",
        user=owner,
        expected_status=None,
    )
    assert resp.status_code == 204, "Clique owner should delete member comments"
    async with ctx.sessionmaker() as session:
        stored_comment = await session.get(Comment, UUID(comment_id))
        assert (
            stored_comment and stored_comment.deleted_at is not None
        ), "Comment should be soft deleted"

    await request_json(
        ctx,
        "DELETE",
        f"/api/v1/posts/{post_id}",
        user=owner,
        expected_status=204,
    )
    _, posts_after = await request_json(
        ctx,
        "GET",
        f"/api/v1/posts/cliques/{clique_id}/posts",
        user=owner,
    )
    ids_after = {item["id"] for item in posts_after["items"]}
    assert post_id not in ids_after, "Deleted posts should not appear in listings"


async def scenario_occupations(ctx: VerifierContext) -> None:
    async with ctx.sessionmaker() as session:
        occ1 = Occupation(name="Photographer", slug=f"photographer-{uuid4().hex[:8]}")
        occ2 = Occupation(name="Stylist", slug=f"stylist-{uuid4().hex[:8]}")
        session.add_all([occ1, occ2])
        await session.flush()
        occ_ids = [str(occ1.id), str(occ2.id)]
        await session.commit()

    _, listed = await request_json(ctx, "GET", "/api/v1/occupations/")
    listed_names = {item["name"] for item in listed}
    assert {"Photographer", "Stylist"}.issubset(
        listed_names
    ), "Occupations listing missing entries"

    user = await register_user(ctx, username="occupation_user")
    await request_json(
        ctx,
        "PUT",
        "/api/v1/occupations/user",
        user=user,
        json=occ_ids,
        expected_status=200,
    )
    async with ctx.sessionmaker() as session:
        stmt = select(UserOccupation).where(UserOccupation.user_id == UUID(user.id))
        rows = (await session.execute(stmt)).scalars().all()
        assert len(rows) == 2, "User occupations not replaced correctly"

    owner = await register_user(ctx, username="occupation_owner", is_business_page=True)
    _, clique = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        expected_status=201,
        user=owner,
        json={
            "name": "Occupation Clique",
            "description": "Pro services",
            "privacy": "public",
            "timezone": "UTC",
            "occupation_ids": [],
            "cancellation_cutoff_hours": 24,
        },
    )
    clique_id = clique["id"]
    await request_json(
        ctx,
        "PUT",
        f"/api/v1/occupations/clique/{clique_id}",
        user=owner,
        json=occ_ids,
        expected_status=200,
    )
    async with ctx.sessionmaker() as session:
        stmt = select(CliqueOccupation).where(
            CliqueOccupation.clique_id == UUID(clique_id)
        )
        rows = (await session.execute(stmt)).scalars().all()
        assert len(rows) == 2, "Clique occupations not updated"


async def scenario_media(ctx: VerifierContext) -> None:
    user = await register_user(ctx, username="media_user")

    _, presign = await request_json(
        ctx,
        "POST",
        "/api/v1/media/uploads/presign",
        user=user,
        params={"mime": "image/jpeg", "size_bytes": 512, "purpose": "avatar"},
    )
    assert presign["method"] == "PUT", "Presign should return PUT method"
    assert presign["upload_url"].startswith("http"), "Upload URL should be HTTP"

    _, registered = await request_json(
        ctx,
        "POST",
        "/api/v1/media",
        user=user,
        json={
            "url": "https://uploads.test/avatar.jpg",
            "mime": "image/jpeg",
            "size_bytes": 512,
            "meta": {"purpose": "avatar"},
        },
    )
    assert "media_id" in registered, "Media registration should return ID"

    resp, error = await request_json(
        ctx,
        "POST",
        "/api/v1/media/uploads/presign",
        user=user,
        params={"mime": "application/pdf", "size_bytes": 20_000_000, "purpose": "doc"},
        expected_status=None,
    )
    assert resp.status_code == 400, "Oversized or invalid mime should be rejected"
    if error:
        assert_error_envelope(error, "validation_error")

    resp, error = await request_json(
        ctx,
        "POST",
        "/api/v1/media",
        user=user,
        json={
            "url": "https://uploads.test/file.exe",
            "mime": "application/octet-stream",
            "size_bytes": 1024,
            "meta": {"purpose": "avatar"},
        },
        expected_status=None,
    )
    assert resp.status_code == 400, "Unsupported mime should be rejected"
    if error:
        assert_error_envelope(error, "validation_error")


async def scenario_services_availability(ctx: VerifierContext) -> None:
    owner = await register_user(ctx, username="services_owner", is_business_page=True)

    _, clique = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        expected_status=201,
        user=owner,
        json={
            "name": "Scheduler",
            "description": "Availability tests",
            "privacy": "public",
            "timezone": "UTC",
            "occupation_ids": [],
            "cancellation_cutoff_hours": 12,
        },
    )
    clique_id = clique["id"]

    service_payload = {
        "title": "Consultation",
        "description": "Initial meeting",
        "price_minor": 10_00,
        "duration_minutes": 60,
        "buffer_minutes": 15,
        "currency": "EUR",
    }
    _, service = await request_json(
        ctx,
        "POST",
        "/api/v1/services/",
        user=owner,
        params={"clique_id": clique_id},
        json=service_payload,
    )
    service_id = service["id"]
    assert service["currency"] == "EUR", "Service currency should default to EUR"

    today = datetime.now(timezone.utc).date()
    _, availability_one_off = await request_json(
        ctx,
        "POST",
        "/api/v1/availability/",
        user=owner,
        params={"clique_id": clique_id},
        json={
            "is_recurring": False,
            "date": today.isoformat(),
            "start_time": "09:00:00",
            "end_time": "11:00:00",
            "timezone": "UTC",
        },
    )
    availability_id = availability_one_off["id"]

    _, availability_recurring = await request_json(
        ctx,
        "POST",
        "/api/v1/availability/",
        user=owner,
        params={"clique_id": clique_id},
        json={
            "is_recurring": True,
            "day_of_week": 1,
            "start_time": "13:00:00",
            "end_time": "15:00:00",
            "timezone": "UTC",
        },
    )
    assert availability_recurring[
        "is_recurring"
    ], "Recurring availability should be created"

    _, updated = await request_json(
        ctx,
        "PUT",
        f"/api/v1/availability/{availability_id}",
        user=owner,
        json={"start_time": "10:00:00"},
    )
    assert updated["start_time"].startswith(
        "10:00"
    ), "Partial availability update should apply"

    _, listed = await request_json(
        ctx,
        "GET",
        f"/api/v1/availability/{clique_id}",
        user=owner,
    )
    assert len(listed) >= 2, "Availability listing should include created entries"

    resp, _ = await request_json(
        ctx,
        "GET",
        f"/api/v1/cliques/{clique_id}/slots",
        user=owner,
        params={
            "serviceId": service_id,
            "from": datetime.now(timezone.utc).isoformat(),
            "to": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        },
        expected_status=None,
    )
    assert (
        resp.status_code == 200
    ), "Slots endpoint should exist and compute availability"


async def scenario_bookings(ctx: VerifierContext) -> None:
    owner = await register_user(ctx, username="booking_owner", is_business_page=True)
    booker = await register_user(ctx, username="booking_client")
    competitor = await register_user(ctx, username="booking_competitor")

    _, clique = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        expected_status=201,
        user=owner,
        json={
            "name": "Booking Clique",
            "description": "Core booking scenarios",
            "privacy": "public",
            "timezone": "UTC",
            "occupation_ids": [],
            "cancellation_cutoff_hours": 24,
        },
    )
    clique_id = clique["id"]

    service_payload = {
        "title": "Therapy Session",
        "description": "One hour",
        "price_minor": 5000,
        "currency": "EUR",
        "duration_minutes": 60,
        "buffer_minutes": 0,
    }
    _, service = await request_json(
        ctx,
        "POST",
        "/api/v1/services/",
        user=owner,
        params={"clique_id": clique_id},
        json=service_payload,
    )
    service_id = service["id"]

    start = datetime.now(timezone.utc) + timedelta(hours=4)
    _, _ = await request_json(
        ctx,
        "POST",
        "/api/v1/availability/",
        user=owner,
        params={"clique_id": clique_id},
        json={
            "is_recurring": False,
            "date": start.date().isoformat(),
            "start_time": (start - timedelta(hours=1))
            .time()
            .isoformat(timespec="minutes"),
            "end_time": (start + timedelta(hours=2))
            .time()
            .isoformat(timespec="minutes"),
            "timezone": "UTC",
        },
    )

    idempotency_key = uuid4().hex
    payload = {
        "service_id": service_id,
        "start_ts": start.isoformat(),
        "note": "First booking",
        "idempotency_key": idempotency_key,
    }
    resp, booking = await request_json(
        ctx,
        "POST",
        "/api/v1/bookings",
        user=booker,
        json=payload,
        expected_status=None,
    )
    assert resp.status_code in {200, 201}, "Booking creation should succeed"
    booking_id = booking["id"]

    resp, repeat = await request_json(
        ctx,
        "POST",
        "/api/v1/bookings",
        user=booker,
        json=payload,
        expected_status=None,
    )
    assert resp.status_code in {200, 201}, "Idempotent replay should succeed"
    assert repeat["id"] == booking_id, "Idempotency should return same booking"

    conflict_payload = {
        "service_id": service_id,
        "start_ts": start.isoformat(),
    }
    resp, error = await request_json(
        ctx,
        "POST",
        "/api/v1/bookings",
        user=competitor,
        json=conflict_payload,
        expected_status=None,
    )
    assert resp.status_code in {409, 422}, "Overlapping booking should be rejected"
    if error:
        assert_error_envelope(error, "conflict")

    _, confirmed = await request_json(
        ctx,
        "POST",
        f"/api/v1/bookings/{booking_id}/confirm",
        user=owner,
    )
    assert confirmed["status"].lower() == "confirmed", "Owner should confirm bookings"

    cutoff_clique_payload = {
        "name": "Cutoff Clique",
        "description": "Cancellation testing",
        "privacy": "public",
        "timezone": "UTC",
        "occupation_ids": [],
        "cancellation_cutoff_hours": 1,
    }
    _, cutoff_clique = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        expected_status=201,
        user=owner,
        json=cutoff_clique_payload,
    )
    cutoff_clique_id = cutoff_clique["id"]

    _, cutoff_service = await request_json(
        ctx,
        "POST",
        "/api/v1/services/",
        user=owner,
        params={"clique_id": cutoff_clique_id},
        json=service_payload,
    )
    cutoff_service_id = cutoff_service["id"]

    start_near = datetime.now(timezone.utc) + timedelta(minutes=30)
    await request_json(
        ctx,
        "POST",
        "/api/v1/availability/",
        user=owner,
        params={"clique_id": cutoff_clique_id},
        json={
            "is_recurring": False,
            "date": start_near.date().isoformat(),
            "start_time": (start_near - timedelta(hours=1))
            .time()
            .isoformat(timespec="minutes"),
            "end_time": (start_near + timedelta(hours=1))
            .time()
            .isoformat(timespec="minutes"),
            "timezone": "UTC",
        },
    )

    resp, inside = await request_json(
        ctx,
        "POST",
        "/api/v1/bookings",
        user=booker,
        json={"service_id": cutoff_service_id, "start_ts": start_near.isoformat()},
        expected_status=None,
    )
    assert resp.status_code in {200, 201}, "Booking near cutoff should be created"
    inside_booking_id = inside["id"]

    resp, error = await request_json(
        ctx,
        "POST",
        f"/api/v1/bookings/{inside_booking_id}/cancel",
        user=booker,
        expected_status=None,
    )
    assert (
        resp.status_code == 400
    ), "Client cancellation inside cutoff should be blocked"
    if error:
        assert_error_envelope(error, "validation_error")

    _, owner_cancel = await request_json(
        ctx,
        "POST",
        f"/api/v1/bookings/{inside_booking_id}/cancel",
        user=owner,
        params={"reason": "Client no-show"},
    )
    assert (
        owner_cancel["status"].lower() == "cancelled"
    ), "Owner should cancel with reason"
    assert owner_cancel.get("cancellation_reason") == "Client no-show"

    resp, _ = await request_json(
        ctx,
        "PATCH",
        f"/api/v1/bookings/{booking_id}/reschedule",
        user=booker,
        json={"start_ts": (start + timedelta(hours=2)).isoformat()},
        expected_status=None,
    )
    assert resp.status_code == 200, "Reschedule endpoint should update booking"

    _, my_bookings = await request_json(
        ctx,
        "GET",
        "/api/v1/bookings/me",
        user=booker,
    )
    my_ids = {item["id"] for item in my_bookings["items"]}
    assert booking_id in my_ids, "Booker should see their booking"

    _, clique_bookings = await request_json(
        ctx,
        "GET",
        f"/api/v1/bookings/cliques/{clique_id}",
        user=owner,
    )
    owner_ids = {item["id"] for item in clique_bookings["items"]}
    assert booking_id in owner_ids, "Owner should list clique bookings"

    async with ctx.sessionmaker() as session:
        booking_row = await session.get(Booking, UUID(booking_id))
        booking_row.status = BookingStatus.COMPLETED
        await session.commit()


async def scenario_reviews(ctx: VerifierContext) -> None:
    owner = await register_user(ctx, username="reviews_owner", is_business_page=True)
    booker = await register_user(ctx, username="reviews_booker")
    outsider = await register_user(ctx, username="reviews_outsider")

    _, clique = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        expected_status=201,
        user=owner,
        json={
            "name": "Review Clique",
            "description": "Reviews testing",
            "privacy": "public",
            "timezone": "UTC",
            "occupation_ids": [],
            "cancellation_cutoff_hours": 24,
        },
    )
    clique_id = clique["id"]

    _, service = await request_json(
        ctx,
        "POST",
        "/api/v1/services/",
        user=owner,
        params={"clique_id": clique_id},
        json={
            "title": "Coaching",
            "description": "Performance coaching",
            "duration_minutes": 45,
            "buffer_minutes": 15,
            "price_minor": 7500,
            "currency": "EUR",
        },
    )
    service_id = service["id"]

    start = datetime.now(timezone.utc) + timedelta(hours=2)
    await request_json(
        ctx,
        "POST",
        "/api/v1/availability/",
        user=owner,
        params={"clique_id": clique_id},
        json={
            "is_recurring": False,
            "date": start.date().isoformat(),
            "start_time": (start - timedelta(hours=1))
            .time()
            .isoformat(timespec="minutes"),
            "end_time": (start + timedelta(hours=1))
            .time()
            .isoformat(timespec="minutes"),
            "timezone": "UTC",
        },
    )

    _, booking = await request_json(
        ctx,
        "POST",
        "/api/v1/bookings",
        user=booker,
        json={"service_id": service_id, "start_ts": start.isoformat()},
        expected_status=201,
    )
    booking_id = booking["id"]

    resp, error = await request_json(
        ctx,
        "POST",
        f"/api/v1/reviews/bookings/{booking_id}",
        user=booker,
        json={"rating": 5, "comment": "Excellent"},
        expected_status=None,
    )
    assert resp.status_code == 400, "Should not review before completion"
    if error:
        assert_error_envelope(error, "validation_error")

    async with ctx.sessionmaker() as session:
        booking_row = await session.get(Booking, UUID(booking_id))
        booking_row.status = BookingStatus.COMPLETED
        await session.commit()

    _, review = await request_json(
        ctx,
        "POST",
        f"/api/v1/reviews/bookings/{booking_id}",
        user=booker,
        json={"rating": 4, "comment": "Great session"},
        expected_status=201,
    )
    assert "id" in review, "Review creation should return ID"

    try:
        resp, error = await request_json(
            ctx,
            "POST",
            f"/api/v1/reviews/bookings/{booking_id}",
            user=booker,
            json={"rating": 3, "comment": "Second attempt"},
            expected_status=None,
        )
    except Exception as exc:
        raise AssertionError(
            f"Second review should return validation error, received {exc.__class__.__name__}: {exc}"
        ) from exc
    assert resp.status_code == 400, "Multiple reviews for same booking should fail"
    if error:
        assert_error_envelope(error, "validation_error")

    resp, error = await request_json(
        ctx,
        "POST",
        f"/api/v1/reviews/bookings/{booking_id}",
        user=outsider,
        json={"rating": 5, "comment": "Not my booking"},
        expected_status=None,
    )
    assert resp.status_code == 403, "Only booker may review"
    if error:
        assert_error_envelope(error, "forbidden")

    _, listing = await request_json(
        ctx,
        "GET",
        f"/api/v1/reviews/cliques/{clique_id}",
        user=owner,
    )
    assert listing["items"], "Reviews listing should include created review"
    average = listing.get("meta", {}).get("average_rating")
    assert average is not None, "Average rating should be reported"


async def scenario_notifications(ctx: VerifierContext) -> None:
    target = await register_user(ctx, username="notify_target")
    actor = await register_user(ctx, username="notify_actor")

    _, _ = await request_json(
        ctx,
        "POST",
        f"/api/v1/users/{target.id}/follow",
        user=actor,
    )

    _, notifications = await request_json(
        ctx,
        "GET",
        "/api/v1/notifications/",
        user=target,
    )
    assert notifications, "Follow event should create a notification"
    first_id = notifications[0]["id"]

    _, marked = await request_json(
        ctx,
        "PUT",
        f"/api/v1/notifications/{first_id}/read",
        user=target,
    )
    assert marked["is_read"], "Read endpoint should mark notification"

    _, mark_all = await request_json(
        ctx,
        "PUT",
        "/api/v1/notifications/read-all",
        user=target,
    )
    assert "Marked" in mark_all["message"], "Read-all endpoint should acknowledge"


async def scenario_search(ctx: VerifierContext) -> None:
    async with ctx.sessionmaker() as session:
        occ = Occupation(name="Searcher", slug=f"search-{uuid4().hex[:8]}")
        session.add(occ)
        await session.commit()
        occupation_id = str(occ.id)

    user = await register_user(ctx, username="search_user")
    owner = await register_user(ctx, username="search_owner", is_business_page=True)

    _, clique_public = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        expected_status=201,
        user=owner,
        json={
            "name": "Searchable",
            "description": "Visible clique",
            "privacy": "public",
            "timezone": "UTC",
            "occupation_ids": [],
            "cancellation_cutoff_hours": 24,
        },
    )

    _, clique_private = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        expected_status=201,
        user=owner,
        json={
            "name": "Hidden",
            "description": "Private search clique",
            "privacy": "private",
            "timezone": "UTC",
            "occupation_ids": [],
            "cancellation_cutoff_hours": 24,
        },
    )

    _, result = await request_json(
        ctx,
        "GET",
        "/api/v1/search/",
        params={"q": "search", "limit": 9},
    )
    assert result["users"], "Search should return users"
    assert result["occupations"], "Search should return occupations"
    assert result["cliques"], "Search should return cliques"

    private_entries = [c for c in result["cliques"] if c["id"] == clique_private["id"]]
    assert private_entries, "Private clique should appear in search"
    private_payload = private_entries[0]
    allowed_keys = {"id", "name", "description", "privacy", "image_url", "timezone"}
    extra_fields = set(private_payload.keys()) - allowed_keys
    assert (
        not extra_fields
    ), "Private clique search results should expose only name/description"


async def scenario_messaging_ws(ctx: VerifierContext) -> None:
    business = await register_user(ctx, username="chat_business", is_business_page=True)
    client = await register_user(ctx, username="chat_client")

    async with ctx.sessionmaker() as session:
        chat = Chat(business_user_id=UUID(business.id), client_user_id=UUID(client.id))
        session.add(chat)
        await session.commit()
        await session.refresh(chat)
        chat_id = str(chat.id)

    _, chats = await request_json(
        ctx,
        "GET",
        "/api/v1/chats/",
        user=business,
    )
    assert chats and chats[0]["id"] == chat_id, "Business user should see created chat"

    _, message = await request_json(
        ctx,
        "POST",
        f"/api/v1/messages/{chat_id}",
        user=client,
        json={"body": "Hello"},
    )
    message_id = message["id"]

    _, history = await request_json(
        ctx,
        "GET",
        f"/api/v1/messages/{chat_id}",
        user=business,
    )
    assert (
        history and history[0]["id"] == message_id
    ), "Messages should list recently sent message"

    _, delete_ok = await request_json(
        ctx,
        "DELETE",
        f"/api/v1/messages/{message_id}",
        user=client,
    )
    assert (
        "deleted" in delete_ok["message"].lower()
    ), "Sender should hard delete within window"

    _, message2 = await request_json(
        ctx,
        "POST",
        f"/api/v1/messages/{chat_id}",
        user=client,
        json={"body": "Too late"},
    )
    message2_id = message2["id"]
    async with ctx.sessionmaker() as session:
        msg = await session.get(Message, UUID(message2_id))
        msg.sent_at = datetime.now(timezone.utc) - timedelta(minutes=16)
        await session.commit()

    resp, error = await request_json(
        ctx,
        "DELETE",
        f"/api/v1/messages/{message2_id}",
        user=client,
        expected_status=None,
    )
    assert (
        resp.status_code == 403
    ), "Deletion beyond retention window should be forbidden"
    if error:
        assert_error_envelope(error, "forbidden")

    if ctx.sync_client is None:
        raise AssertionError("Synchronous WebSocket client unavailable")

    with ctx.sync_client.websocket_connect(
        f"/ws/chat?chat_id={chat_id}&token={client.access_token}"
    ) as client_ws:
        with ctx.sync_client.websocket_connect(
            f"/ws/chat?chat_id={chat_id}&token={business.access_token}"
        ) as owner_ws:
            payload = {
                "content": "Ping",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            client_ws.send_json(payload)
            message_event = owner_ws.receive_json()
            assert (
                message_event.get("content") == "Ping"
            ), "WebSocket should relay messages"
            assert (
                message_event.get("type") == "message.created"
            ), "WebSocket event type should indicate creation"

            client_ws.send_json({"type": "typing"})
            typing_event = owner_ws.receive_json()
            assert typing_event.get("type") == "typing", "Typing event should propagate"


async def scenario_db_invariants(ctx: VerifierContext) -> None:
    payload = {
        "email": "case@example.com",
        "username": "CaseUser",
        "password": "Passw0rd!",
        "full_name": "Case User",
        "bio": "",
        "profile_image_url": None,
        "is_business_page": False,
        "is_private_account": False,
        "is_admin": False,
        "is_active": True,
    }
    resp, data = await request_json(
        ctx,
        "POST",
        "/api/v1/auth/register",
        json=payload,
        expected_status=None,
    )
    assert resp.status_code == 201, f"Initial registration failed: {resp.status_code}"
    original_user_id = data["user"]["id"]

    dup_payload = payload | {"email": "case+dup@example.com", "username": "caseuser"}
    resp, error = await request_json(
        ctx,
        "POST",
        "/api/v1/auth/register",
        json=dup_payload,
        expected_status=None,
    )
    assert (
        resp.status_code == 409
    ), "Case-insensitive username uniqueness should be enforced"
    if error:
        assert_error_envelope(error, "conflict")

    owner = await register_user(ctx, username="owner_invariant", is_business_page=True)
    _, clique = await request_json(
        ctx,
        "POST",
        "/api/v1/cliques",
        expected_status=201,
        user=owner,
        json={
            "name": "Invariant Clique",
            "description": "",
            "privacy": "public",
            "timezone": "UTC",
            "occupation_ids": [],
            "cancellation_cutoff_hours": 24,
        },
    )
    clique_id = clique["id"]
    async with ctx.sessionmaker() as session:
        stmt = select(CliqueMember).where(
            CliqueMember.clique_id == UUID(clique_id), CliqueMember.role == Role.OWNER
        )
        owners = (await session.execute(stmt)).scalars().all()
        assert len(owners) == 1, "Clique should have exactly one owner membership"

    _, service = await request_json(
        ctx,
        "POST",
        "/api/v1/services/",
        user=owner,
        params={"clique_id": clique_id},
        json={
            "title": "Invariant Service",
            "description": "",
            "duration_minutes": 30,
            "buffer_minutes": 0,
            "price_minor": 1000,
            "currency": "EUR",
        },
    )
    service_id = service["id"]

    start = datetime.now(timezone.utc) + timedelta(hours=3)
    end = start + timedelta(minutes=30)
    async with ctx.sessionmaker() as session:
        booking = Booking(
            clique_id=UUID(clique_id),
            service_id=UUID(service_id),
            user_id=UUID(original_user_id),
            start_ts=start,
            end_ts=end,
            status=BookingStatus.PENDING,
        )
        session.add(booking)
        await session.commit()

    async with ctx.sessionmaker() as session:
        overlap = Booking(
            clique_id=UUID(clique_id),
            service_id=UUID(service_id),
            user_id=UUID(original_user_id),
            start_ts=start + timedelta(minutes=10),
            end_ts=end + timedelta(minutes=10),
            status=BookingStatus.PENDING,
        )
        session.add(overlap)
        try:
            await session.commit()
        except Exception:
            await session.rollback()
        else:
            raise AssertionError(
                "Database should enforce exclusion constraint against overlapping bookings"
            )


SCENARIOS: list[ScenarioDefinition] = [
    ScenarioDefinition("S1 Auth", "Cross-cutting", scenario_auth),
    ScenarioDefinition(
        "S2 Users & follows", "Privacy & relationships", scenario_users_and_follows
    ),
    ScenarioDefinition("S3 Cliques", "Privacy & relationships", scenario_cliques),
    ScenarioDefinition("S4 Posts", "Social content", scenario_posts),
    ScenarioDefinition("S5 Occupations", "Cross-cutting", scenario_occupations),
    ScenarioDefinition("S6 Media", "Media", scenario_media),
    ScenarioDefinition(
        "S7 Services & Availability",
        "Scheduling/Bookings",
        scenario_services_availability,
    ),
    ScenarioDefinition("S8 Bookings", "Scheduling/Bookings", scenario_bookings),
    ScenarioDefinition("S9 Reviews", "Reviews", scenario_reviews),
    ScenarioDefinition("S10 Notifications", "Notifications", scenario_notifications),
    ScenarioDefinition("S11 Search", "Search", scenario_search),
    ScenarioDefinition("S12 Messaging + WS", "Messaging & WS", scenario_messaging_ws),
    ScenarioDefinition("S13 DB invariants", "DB invariants", scenario_db_invariants),
]


async def main() -> None:
    ctx: VerifierContext | None = None
    async_stack: AsyncExitStack | None = None
    sync_stack: ExitStack | None = None
    results: list[ScenarioResult] = []

    try:
        ctx, async_stack, sync_stack = await bootstrap_infrastructure()
        for scenario in SCENARIOS:
            result = await run_scenario(ctx, scenario)
            results.append(result)
    finally:
        if async_stack is not None:
            await async_stack.aclose()
        if ctx is not None:
            await ctx.redis.aclose()
            await ctx.engine.dispose()
        if sync_stack is not None:
            sync_stack.close()

    report, all_passed = build_report(results)
    write_report(report)
    if not all_passed:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
