from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

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

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenRead, status_code=201)
# @limiter.limit("5/minute")
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email_or_username(
        db, user_data.email, user_data.username
    )
    if existing:
        raise Conflict()
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


@router.post("/login", response_model=TokenRead)
# @limiter.limit("10/minute")
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
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


@router.post("/refresh", response_model=TokenRead)
async def refresh(refresh_data: RefreshRequest, db: AsyncSession = Depends(get_db)):
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


@router.post("/logout", status_code=status.HTTP_200_OK)
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
