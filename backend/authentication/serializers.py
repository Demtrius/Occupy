"""
Authentication Serializers

This module provides serializers for user authentication, registration, and JWT token handling.
All serializers include comprehensive type annotations for better code clarity and type safety.
"""

from typing import Any, Dict, Optional, List
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from users.models import Occupier
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import Token
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

    def get_occupations(self, obj: Occupier) -> List[str]:
        """Get a list of occupation names for the user."""
        return [occupation.name for occupation in obj.occupations.all()]


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
    occupations = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=True,
        help_text="Your occupation(s) or profession as a list of strings",
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
        # Extract is_business_page flag if present
        is_business_page = validated_data.pop("is_business_page", False)
        occupations_data = validated_data.pop("occupations", [])

        # Create user with appropriate method
        if is_business_page:
            user = Occupier.objects.create_business_page(**validated_data)
        else:
            user = Occupier.objects.create_user(**validated_data)

        # Add occupations
        from core.models import Occupation
        for occupation_name in occupations_data:
            occupation, _ = Occupation.objects.get_or_create(name=occupation_name.lower())
            user.occupations.add(occupation)

        return user


class LoginSerializer(serializers.ModelSerializer):
    """
    Serializer for user login.

    Handles user authentication with email or username and password.
    Returns JWT token upon successful authentication.
    """

    password = serializers.CharField(
        max_length=128,
        min_length=6,
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = Occupier
        fields = ("email", "password", "token")
        read_only_fields = ["token"]


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that supports email or username login.

    Extends the default TokenObtainPairSerializer to:
    - Accept either email or username for authentication
    - Include user data in the response
    - Add custom claims to JWT tokens
    """

    email = serializers.EmailField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """
        Initialize serializer and make username field optional.

        Args:
            *args: Variable length argument list
            **kwargs: Arbitrary keyword arguments
        """
        super().__init__(*args, **kwargs)
        self.fields[self.username_field].required = False

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

        # Remove 'email' from attrs if it was provided, as the parent serializer doesn't need it.
        if "email" in attrs:
            del attrs["email"]

        # Ensure username field is set with the provided username or email value
        # The custom backend will handle authenticating with email or username
        attrs["username"] = username_or_email

        # Call the parent's validate method, which will use the custom backend
        try:
            validated_data: Dict[str, Any] = super().validate(attrs)
            # Add user data to the response
            validated_data["user"] = UserSerializer(self.user).data
            return validated_data
        except AuthenticationFailed as e:
            raise serializers.ValidationError({"detail": str(e)})

    @classmethod
    def get_token(cls, user: Occupier) -> Token:
        """
        Generate JWT token with custom claims for the user.

        Adds username, email, and occupations to the token payload.

        Args:
            user: The user instance to generate token for

        Returns:
            Token: JWT token with custom claims
        """
        token: Token = super().get_token(user)
        token["username"] = user.username
        token["email"] = user.email
        token["occupations"] = [occupation.name for occupation in user.occupations.all()]
        return token
