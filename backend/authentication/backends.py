"""
Custom Authentication Backends

This module provides custom authentication backends for the Occupy application.
The EmailOrUsernameModelBackend allows users to authenticate using either their
username or email address, providing flexibility in the login process.
"""

from typing import Optional
import logging
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import HttpRequest

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
