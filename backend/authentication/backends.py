"""
Custom Authentication Backends

This module provides custom authentication backends for the Occupy application.
The EmailOrUsernameModelBackend allows users to authenticate using either their
username or email address, providing flexibility in the login process.
"""

from typing import Optional
import logging
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import HttpRequest
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()
logger = logging.getLogger(__name__)


class EmailOrUsernameModelBackend(ModelBackend):
    """
    Custom authentication backend that allows users to log in using either
    their username or email address.

    This backend extends Django's ModelBackend to provide additional flexibility
    in user authentication. It searches for users by both username and email
    fields, allowing either to be used as the login identifier.

    Usage:
        Add to AUTHENTICATION_BACKENDS in settings:
        AUTHENTICATION_BACKENDS = [
            'authentication.backends.EmailOrUsernameModelBackend',
            'django.contrib.auth.backends.ModelBackend',
        ]
    """

    def authenticate(
        self,
        request: Optional[HttpRequest],
        username: Optional[str] = None,
        password: Optional[str] = None,
        **kwargs: any,
    ) -> Optional[User]:
        """
        Authenticate user with username or email and password.

        This method attempts to find a user by searching for a match in either
        the username or email fields. If a user is found and the password is
        correct, the user object is returned.

        Args:
            request: The current HTTP request object (can be None)
            username: Can be either the actual username or email address
            password: The user's password in plain text
            **kwargs: Additional keyword arguments (unused but required by Django)

        Returns:
            User object if authentication is successful, None otherwise

        Examples:
            >>> backend = EmailOrUsernameModelBackend()
            >>> user = backend.authenticate(None, 'john@example.com', 'password123')
            >>> user = backend.authenticate(None, 'johndoe', 'password123')
        """
        logger.debug(
            f"EmailOrUsernameModelBackend.authenticate called with username={username}"
        )

        if username is None or password is None:
            logger.debug("Username or password is None, returning None")
            return None

        try:
            # Try to fetch the user by searching for username OR email
            logger.debug(f"Searching for user with username or email: {username}")
            user: Optional[User] = User.objects.filter(
                Q(username=username) | Q(email=username)
            ).first()

            # If user not found, return None
            if user is None:
                logger.debug(f"No user found with username or email: {username}")
                # Run the default password hasher once to reduce the timing
                # difference between an existing and a nonexistent user
                User().set_password(password)
                return None

            logger.debug(f"User found: {user.username} (email: {user.email})")

            # Check if password is correct
            if user.check_password(password):
                logger.debug("Password check passed")
                # Verify user is active
                if self.user_can_authenticate(user):
                    logger.debug(f"User can authenticate, returning user: {user}")
                    return user
                else:
                    logger.debug("User cannot authenticate (inactive)")
            else:
                logger.debug("Password check failed")

        except Exception as e:
            # Log the exception
            logger.error(f"Exception in authenticate: {e}", exc_info=True)
            return None

        logger.debug("Returning None from authenticate")
        return None

    def get_user(self, user_id: int) -> Optional[User]:
        """
        Get user by their primary key ID.

        This method is called by Django to retrieve a user object from the
        session. It verifies that the user exists and can authenticate.

        Args:
            user_id: The user's primary key (ID)

        Returns:
            User object if found and active, None otherwise

        Examples:
            >>> backend = EmailOrUsernameModelBackend()
            >>> user = backend.get_user(42)
        """
        try:
            user: User = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

        return user if self.user_can_authenticate(user) else None

    def user_can_authenticate(self, user: User) -> bool:
        """
        Check if the user is allowed to authenticate.

        Rejects users with is_active=False. Custom user models that don't have
        an `is_active` field are allowed by default.

        Args:
            user: The user object to check

        Returns:
            True if user can authenticate, False otherwise

        Examples:
            >>> backend = EmailOrUsernameModelBackend()
            >>> can_auth = backend.user_can_authenticate(user)
        """
        is_active: Optional[bool] = getattr(user, "is_active", None)
        return is_active or is_active is None


class CustomJWTAuthentication(BaseAuthentication):
    """
    Custom JWT authentication class using PyJWT.

    Authenticates users based on JWT tokens in the Authorization header.
    Supports access and refresh token validation.
    """

    def authenticate(self, request):
        """
        Authenticate the request using JWT token from Authorization header.

        Returns:
            tuple: (user, token) if authentication succeeds
            None: if no token is provided
        Raises:
            AuthenticationFailed: if token is invalid or expired
        """
        # Get the authorization header
        auth_header = self.get_authorization_header(request)
        if not auth_header:
            return None

        # Decode the header
        try:
            auth_header = auth_header.decode('utf-8')
        except UnicodeDecodeError:
            raise AuthenticationFailed('Invalid token header encoding')

        # Check for Bearer prefix
        if not auth_header.startswith('Bearer '):
            return None

        # Extract token
        token = auth_header[7:]  # Remove 'Bearer ' prefix

        # Validate token
        return self.authenticate_credentials(token)

    def authenticate_credentials(self, token):
        """
        Validate JWT token and return user.

        Args:
            token: JWT token string

        Returns:
            tuple: (user, token)

        Raises:
            AuthenticationFailed: if token is invalid
        """
        try:
            # Decode the token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')

        # Get user from payload
        user_id = payload.get('user_id')
        if not user_id:
            raise AuthenticationFailed('Token missing user_id')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')

        # Check if user is active
        if not user.is_active:
            raise AuthenticationFailed('User account is disabled')

        return (user, token)

    def get_authorization_header(self, request):
        """
        Return the Authorization header from the request.

        Returns:
            bytes: The authorization header value
        """
        auth = request.META.get('HTTP_AUTHORIZATION', b'')
        if isinstance(auth, str):
            auth = auth.encode('iso-8859-1')
        return auth
