"""
Authentication Utility Functions

This module provides utility functions for JWT token generation and management.
All functions include comprehensive type annotations for better code clarity and type safety.
"""

from typing import Dict
from datetime import datetime, timedelta
import jwt
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import Occupier


def generate_access_token(occupier: Occupier) -> str:
    """
    Generate a JWT access token for the given user.

    This function creates a custom JWT token with a 25-hour expiration time.
    Note: This is a legacy function. Consider using create_jwt_pair_for_user
    which utilizes djangorestframework-simplejwt for better token management.

    Args:
        occupier: The Occupier (user) instance to generate a token for

    Returns:
        str: The encoded JWT access token

    Examples:
        >>> user = Occupier.objects.get(username='johndoe')
        >>> token = generate_access_token(user)
        >>> print(token)
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

    Note:
        The token includes:
        - exp: Expiration time (current time + 1 day + 60 minutes)
        - iat: Issued at time (current time)
    """
    payload: Dict[str, datetime] = {
        # 'occupier_id': occupier.occupier_id,  # Commented out in original
        "exp": datetime.now() + timedelta(days=1, minutes=60),
        "iat": datetime.now(),
    }

    access_token: str = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return access_token


def create_jwt_pair_for_user(occupier: Occupier) -> Dict[str, str]:
    """
    Create a JWT token pair (access and refresh) for the given user.

    This function uses djangorestframework-simplejwt to generate a standard
    JWT token pair. The tokens follow the configuration defined in
    settings.SIMPLE_JWT.

    Args:
        occupier: The Occupier (user) instance to generate tokens for

    Returns:
        Dict[str, str]: A dictionary containing:
            - 'access': The access token (short-lived, used for API requests)
            - 'refresh': The refresh token (longer-lived, used to obtain new access tokens)

    Examples:
        >>> user = Occupier.objects.get(username='johndoe')
        >>> tokens = create_jwt_pair_for_user(user)
        >>> print(tokens['access'])
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        >>> print(tokens['refresh'])
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

    Note:
        Token lifetimes are configured in settings.SIMPLE_JWT:
        - ACCESS_TOKEN_LIFETIME: Default 2 hours
        - REFRESH_TOKEN_LIFETIME: Default 1 day
    """
    refresh: RefreshToken = RefreshToken.for_user(occupier)
    tokens: Dict[str, str] = {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }
    return tokens
