import os
from datetime import datetime, timedelta, timezone
from typing import Annotated, AsyncGenerator
from uuid import UUID

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from ..models.user import User


# Settings
def get_jwt_secret() -> str:
    """Return the JWT secret from environment in a single place."""
    return os.getenv("JWT_SECRET", "change-me-in-prod")


JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

password_hasher = PasswordHasher()

# Placeholder, set in main.py
sessionmaker: async_sessionmaker[AsyncSession] | None = None


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if sessionmaker is None:
        raise RuntimeError("Database sessionmaker not initialized")
    async with sessionmaker() as session:
        yield session


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


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, get_jwt_secret(), algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


security = HTTPBearer()


async def get_current_user(
    token: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token.credentials)
    if payload is None:
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    user = await db.get(User, UUID(user_id))
    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def require_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="User is not active")
    return current_user


async def require_admin(
    current_user: Annotated[User, Depends(require_active_user)]
) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin required")
    return current_user
