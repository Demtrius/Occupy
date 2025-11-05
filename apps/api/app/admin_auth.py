import os
from uuid import UUID

from starlette.requests import Request

from sqladmin.authentication import AuthenticationBackend

from app.core.auth import create_access_token, decode_token, verify_password
from app.db.session import async_session_maker as async_session
from app.models import User
from app.services.users import get_user_by_email_or_username


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")

        if not username or not password:
            return False

        async with async_session() as session:
            user = await get_user_by_email_or_username(session, username, username)

        if not user or not user.is_admin:
            return False

        if not verify_password(password, user.password_hash):
            return False

        access_token = create_access_token({"sub": str(user.id)})
        request.session.update({"token": access_token})

        return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get("token")

        if not token:
            return False

        payload = decode_token(token)
        if not payload:
            return False

        user_id = payload.get("sub")
        if not user_id:
            return False

        async with async_session() as session:
            user = await session.get(User, UUID(user_id))

        if not user or not user.is_admin:
            return False

        return True


authentication_backend = AdminAuth(secret_key=os.environ.get("JWT_SECRET", "a-secret"))
