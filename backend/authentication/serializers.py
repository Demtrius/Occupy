"""
Authentication Serializers

This module provides serializers for user authentication, registration, and JWT token handling.
All serializers include comprehensive type annotations for better code clarity and type safety.
"""

from typing import Any, Dict, Optional, List
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from users.models import Occupier
from django.contrib.auth import authenticate


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user data returned to mobile app.

    Includes all essential user information except sensitive data like passwords.
    """

    occupations = serializers.SerializerMethodField()

    class Meta:
        model = Occupier
        fields = (
            "id",
            "username",
            "email",
            "occupations",
            "first_name",
            "last_name",
            "created",
            "is_business_page",
            "private_account",
        )
        read_only_fields = ("id", "created")

    def get_occupations(self, obj: Occupier) -> str:
        """Get the occupation name for the user."""
        return obj.occupations or ""


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.

    Validates registration data and creates new user accounts.
    Password is write-only and never returned in responses.
    """

    username = serializers.CharField(
        max_length=30,
        min_length=3,
        required=True,
        help_text="Username must be 3-30 characters, alphanumeric and underscores only",
    )
    email = serializers.EmailField(
        required=True,
        help_text="Valid email address required",
    )
    password = serializers.CharField(
        max_length=65,
        min_length=8,
        write_only=True,
        style={"input_type": "password"},
        help_text="Password must be at least 8 characters long",
    )
    occupations = serializers.CharField(
        max_length=200,
        required=True,
        help_text="Your occupation or profession",
    )
    is_business_page = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Set to true for business account registration",
    )

    class Meta:
        model = Occupier
        fields = ("username", "email", "occupations", "password", "is_business_page")

    def validate_username(self, value: str) -> str:
        """
        Validate username format and uniqueness.

        Args:
            value: The username to validate

        Returns:
            str: The validated username

        Raises:
            serializers.ValidationError: If username is invalid
        """
        import re

        # Check format (alphanumeric and underscores only)
        if not re.match(r"^[a-zA-Z0-9_]+$", value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and underscores"
            )

        # Check uniqueness
        if Occupier.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken")

        return value.lower()

    def validate_email(self, value: str) -> str:
        """
        Validate email uniqueness.

        Args:
            value: The email to validate

        Returns:
            str: The validated email

        Raises:
            serializers.ValidationError: If email is already registered
        """
        # Check uniqueness
        if Occupier.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError(
                "An account with this email already exists"
            )

        return value.lower()

    def create(self, validated_data: Dict[str, Any]) -> Occupier:
        """
        Create a new user with validated data.

        Args:
            validated_data: Dictionary containing validated user data

        Returns:
            Occupier: The newly created user instance
        """
        # Extract fields that are not part of the user model
        is_business_page = validated_data.pop("is_business_page", False)
        occupations_data = validated_data.pop("occupations", "")
        password = validated_data.pop("password", None)

        # Create user with appropriate method
        if is_business_page:
            user = Occupier.objects.create_business_page(
                occupations=occupations_data, password=password, **validated_data
            )
        else:
            user = Occupier.objects.create_user(
                occupations=occupations_data, password=password, **validated_data
            )

        return user


class LoginSerializer(serializers.ModelSerializer):
    """
    Serializer for user login.

    Handles user authentication with email or username and password.
    This serializer is used to validate the login request, but the token
    is generated and returned by the view.
    """

    password = serializers.CharField(
        max_length=128,
        min_length=6,
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = Occupier
        fields = ("email", "password")


class LogoutSerializer(serializers.Serializer):
    """
    Serializer for user logout.

    Expects a refresh token to blacklist.
    """

    refresh_token = serializers.CharField(
        required=True, help_text="The refresh token to blacklist"
    )


class MyTokenObtainPairSerializer(serializers.Serializer):
    """
    Custom JWT token serializer that supports email or username login.

    Extends the default TokenObtainPairSerializer to:
    - Accept either email or username for authentication
    - Include user data in the response
    - Add custom claims to JWT tokens
    """

    email = serializers.EmailField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)

    email = serializers.EmailField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate credentials and authenticate user.

        This method supports authentication with either username or email.
        It also adds user data to the response.

        Args:
            attrs: Dictionary containing authentication credentials

        Returns:
            Dict containing access token, refresh token, and user data

        Raises:
            serializers.ValidationError: If credentials are invalid or missing
        """
        # Get the raw username or email and password from the request data
        username_or_email: Optional[str] = attrs.get("username") or attrs.get("email")

        password: Optional[str] = attrs.get("password")

        if not username_or_email:
            raise serializers.ValidationError(
                {"detail": "Either username or email is required."}
            )
        if not password:
            raise serializers.ValidationError({"detail": "Password is required."})

        # Authenticate user
        from django.contrib.auth import authenticate

        user = authenticate(username=username_or_email, password=password)

        if user is None:
            raise serializers.ValidationError({"detail": "Invalid credentials."})

        if not user.is_active:
            raise serializers.ValidationError({"detail": "User account is disabled."})

        # Generate tokens
        from .utils import create_jwt_pair_for_user

        tokens = create_jwt_pair_for_user(user)

        # Add user data
        user_serializer = UserSerializer(user)

        return {
            "access": tokens["access"],
            "refresh": tokens["refresh"],
            "user": user_serializer.data,
        }
