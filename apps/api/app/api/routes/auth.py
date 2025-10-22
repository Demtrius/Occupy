from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ...api.openapi_helpers import error_responses, secured
from ...core.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_db,
    hash_password,
    is_refresh_token_active,
    require_active_user,
    revoke_refresh_token,
    store_refresh_token,
    verify_password,
)
from ...core.errors import Conflict
from ...core.limiter import limiter
from ...models.user import User
from ...schemas.user import LoginRequest, RefreshRequest, TokenRead, UserCreate
from ...services.users import create_user, get_user_by_email_or_username

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])


@router.post(
    "/register",
    summary="Register new user",
    description="Create a user account and return signed access and refresh tokens.",
    response_model=TokenRead,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {
            "description": "Registration successful",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "user": {
                            "id": "7e3aab18-ec8d-49b7-b1da-e04591c8d9f8",
                            "email": "founder@example.com",
                            "username": "clique_founder",
                            "full_name": "Clique Founder",
                            "bio": "Owner of Clique Salon",
                            "profile_image_url": "https://cdn.example.com/profiles/clique_founder.png",
                            "is_admin": False,
                            "is_active": True,
                            "is_private_account": False,
                            "is_business_page": True,
                            "created_at": "2024-03-01T09:00:00Z",
                            "updated_at": "2024-03-01T09:00:00Z",
                        },
                    }
                }
            },
        },
        **error_responses(400, 409, 422, 503),
    },
)
# @limiter.limit("5/minute")
async def register(
    user_data: UserCreate = Body(
        ...,
        examples={
            "business": {
                "summary": "Business profile",
                "value": {
                    "email": "founder@example.com",
                    "username": "clique_founder",
                    "password": "Sup3rSecure!",
                    "full_name": "Clique Founder",
                    "bio": "Specialist in curated beauty services.",
                    "profile_image_url": "https://cdn.example.com/profiles/clique_founder.png",
                    "is_business_page": True,
                },
            }
        },
    ),
    db: AsyncSession = Depends(get_db),
):
    existing = await get_user_by_email_or_username(
        db, user_data.email, user_data.username
    )
    if existing:
        raise Conflict()
    try:
        user = await create_user(
            db,
            user_data.email,
            user_data.username,
            hash_password(user_data.password),
            user_data.full_name,
            user_data.bio,
            user_data.profile_image_url,
            user_data.is_admin,
            user_data.is_active,
            user_data.is_private_account,
            user_data.is_business_page,
        )
    except IntegrityError as exc:
        await db.rollback()
        message = str(getattr(exc, "orig", exc)).lower()
        if "uq_users_username_ci" in message:
            raise Conflict(message="Username already taken") from exc
        raise Conflict() from exc
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token, refresh_jti, refresh_exp = create_refresh_token(
        {"sub": str(user.id)}
    )
    try:
        await store_refresh_token(refresh_jti, str(user.id), refresh_exp)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Token store unavailable",
        ) from exc
    return TokenRead(access_token=access_token, refresh_token=refresh_token, user=user)


# @limiter.limit("10/minute")
@router.post(
    "/login",
    summary="Login with email or username",
    description="Validate credentials and issue new access and refresh tokens.",
    response_model=TokenRead,
    responses={
        200: {
            "description": "Authenticated",
            "content": {
                "application/json": {
                    "example": {
                        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                        "user": {
                            "id": "7e3aab18-ec8d-49b7-b1da-e04591c8d9f8",
                            "email": "founder@example.com",
                            "username": "clique_founder",
                            "full_name": "Clique Founder",
                            "bio": "Owner of Clique Salon",
                            "profile_image_url": "https://cdn.example.com/profiles/clique_founder.png",
                            "is_admin": False,
                            "is_active": True,
                            "is_private_account": False,
                            "is_business_page": True,
                            "created_at": "2024-03-01T09:00:00Z",
                            "updated_at": "2024-03-01T09:00:00Z",
                        },
                    }
                }
            },
        },
        **error_responses(401, 422, 503),
    },
)
# @limiter.limit("10/minute")
async def login(
    credentials: LoginRequest = Body(
        ...,
        examples={
            "by_email": {
                "summary": "Email login",
                "value": {
                    "email_or_username": "founder@example.com",
                    "password": "Sup3rSecure!",
                },
            }
        },
    ),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_by_email_or_username(
        db, credentials.email_or_username, credentials.email_or_username
    )
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token, refresh_jti, refresh_exp = create_refresh_token(
        {"sub": str(user.id)}
    )
    try:
        await store_refresh_token(refresh_jti, str(user.id), refresh_exp)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Token store unavailable",
        ) from exc
    return TokenRead(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post(
    "/refresh",
    summary="Refresh access token",
    description="Exchange a valid refresh token for a new access + refresh pair.",
    response_model=TokenRead,
    responses={
        200: {"description": "Tokens refreshed"},
        **error_responses(401, 422, 503),
    },
)
async def refresh(
    refresh_data: RefreshRequest = Body(
        ...,
        examples={
            "standard": {
                "summary": "Refresh token",
                "value": {"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."},
            }
        },
    ),
    db: AsyncSession = Depends(get_db),
):
    payload = decode_token(refresh_data.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    jti = payload.get("jti")
    if not user_id or not jti:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    try:
        token_active = await is_refresh_token_active(jti, user_id)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Token store unavailable",
        ) from exc
    if not token_active:
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    user = await db.get(User, UUID(user_id))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    try:
        await revoke_refresh_token(jti)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Token store unavailable",
        ) from exc
    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token, new_jti, new_exp = create_refresh_token({"sub": str(user.id)})
    try:
        await store_refresh_token(new_jti, str(user.id), new_exp)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Token store unavailable",
        ) from exc
    return TokenRead(
        access_token=access_token, refresh_token=new_refresh_token, user=user
    )


@router.post(
    "/logout",
    summary="Revoke refresh token",
    description="Invalidate an issued refresh token for the current user.",
    status_code=status.HTTP_200_OK,
    response_model=dict[str, str],
    responses={
        200: {
            "description": "Refresh token revoked",
            "content": {"application/json": {"example": {"message": "Logged out"}}},
        },
        **error_responses(401, 422, 503),
    },
    openapi_extra=secured(),
)
async def logout(
    logout_data: RefreshRequest, current_user: User = Depends(require_active_user)
):
    payload = decode_token(logout_data.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user_id = payload.get("sub")
    jti = payload.get("jti")
    if not user_id or not jti or str(current_user.id) != user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    try:
        token_active = await is_refresh_token_active(jti, user_id)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Token store unavailable",
        ) from exc
    if token_active:
        try:
            await revoke_refresh_token(jti)
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Token store unavailable",
            ) from exc

    return {"message": "Logged out"}
