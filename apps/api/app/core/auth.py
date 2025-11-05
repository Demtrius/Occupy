import os
from datetime import datetime, timedelta, timezone
from typing import Annotated, AsyncGenerator
from uuid import UUID, uuid4

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from redis.exceptions import RedisError
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db
from ..models.user import User
from .errors import Forbidden, Unauthorized
from .redis import get_redis_client


# Settings
def get_jwt_secret() -> str:
    """Return the JWT secret from environment in a single place."""
    return os.getenv("JWT_SECRET", "change-me-in-prod")


JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
REFRESH_TOKEN_PREFIX = "auth:refresh"

password_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        password_hasher.verify(hashed, password)
        return True
    except VerifyMismatchError:
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, get_jwt_secret(), algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> tuple[str, str, datetime]:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    jti = uuid4().hex
    to_encode.update({"exp": expire, "jti": jti})
    encoded_jwt = jwt.encode(to_encode, get_jwt_secret(), algorithm=JWT_ALGORITHM)
    return encoded_jwt, jti, expire


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def _refresh_key(jti: str) -> str:
    return f"{REFRESH_TOKEN_PREFIX}:{jti}"


def _seconds_until(expire_at: datetime) -> int:
    now = datetime.now(timezone.utc)
    return max(int((expire_at - now).total_seconds()), 0)


async def store_refresh_token(jti: str, user_id: str, expires_at: datetime) -> None:
    try:
        client = get_redis_client()
        ttl_seconds = _seconds_until(expires_at)
        if ttl_seconds <= 0:
            await client.delete(_refresh_key(jti))
            return
        await client.set(_refresh_key(jti), user_id, ex=ttl_seconds)
    except RedisError as exc:  # pragma: no cover - defensive
        raise RuntimeError("Unable to persist refresh token") from exc
    except RuntimeError:
        raise


async def is_refresh_token_active(jti: str, user_id: str) -> bool:
    try:
        client = get_redis_client()
        stored_user_id = await client.get(_refresh_key(jti))
    except RedisError as exc:  # pragma: no cover - defensive
        raise RuntimeError("Unable to read refresh token state") from exc
    except RuntimeError:
        raise
    return stored_user_id == user_id


async def revoke_refresh_token(jti: str) -> None:
    try:
        client = get_redis_client()
        await client.delete(_refresh_key(jti))
    except RedisError as exc:  # pragma: no cover - defensive
        raise RuntimeError("Unable to revoke refresh token") from exc
    except RuntimeError:
        raise


security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ] = None,
    db: AsyncSession = Depends(get_db),
) -> User:
    token: str | None = None
    if credentials:
        raw_credentials = getattr(credentials, "credentials", None)
        scheme = getattr(credentials, "scheme", "Bearer")
        if (
            raw_credentials
            and isinstance(raw_credentials, str)
            and scheme.lower() == "bearer"
        ):
            token = raw_credentials.strip()
    if not token:
        raise Unauthorized(message="Missing or invalid token")
    payload = decode_token(token)
    if payload is None:
        raise Unauthorized(message="Invalid token")
    user_id: str = payload.get("sub")
    if user_id is None:
        raise Unauthorized(message="Invalid token")
    user = await db.get(User, UUID(user_id))
    if user is None:
        raise Unauthorized(message="Invalid token")
    return user


async def require_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.is_active:
        raise Forbidden(message="User is not active")
    return current_user


async def require_admin(
    current_user: Annotated[User, Depends(require_active_user)]
) -> User:
    if not current_user.is_admin:
        raise Forbidden(message="Admin required", details={"reason": "admin_required"})
    return current_user
