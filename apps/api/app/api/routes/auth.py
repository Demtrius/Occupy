from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.auth import (
    create_access_token,
    create_refresh_token,
    get_db,
    hash_password,
    require_active_user,
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
    refresh_token = create_refresh_token({"sub": str(user.id)})
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
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenRead(access_token=access_token, refresh_token=refresh_token, user=user)


@router.post("/refresh", response_model=TokenRead)
async def refresh(refresh_data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    # TODO: Implement refresh logic
    pass


@router.post("/logout")
async def logout(current_user: User = Depends(require_active_user)):
    # TODO: Blacklist refresh token
    return {"message": "Logged out"}
