"""
Authentication Views

This module provides API views for user authentication, registration, and profile management.
All views include comprehensive type annotations for better code clarity and IDE support.
"""

from typing import Any, Dict, Optional
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    MyTokenObtainPairSerializer,
    UserSerializer,
)
from users.models import Occupier
from django.contrib.auth import authenticate
from .utils import create_jwt_pair_for_user


@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(APIView):
    """
    Register a new user and return JWT tokens with user data

    POST /api/auth/users/
    """

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Handle user registration.

        Args:
            request: The HTTP request containing user registration data

        Returns:
            Response with access token, refresh token, and user data
        """
        try:
            serializer = self.serializer_class(data=request.data)

            if serializer.is_valid():
                # Create the user
                user: Occupier = serializer.save()

                # Generate JWT tokens for the new user
                tokens: Dict[str, str] = create_jwt_pair_for_user(user)

                # Get user data
                user_serializer = UserSerializer(user)

                # Return tokens and user data
                response_data: Dict[str, Any] = {
                    "access": tokens["access"],
                    "refresh": tokens["refresh"],
                    "user": user_serializer.data,
                }

                return Response(response_data, status=status.HTTP_201_CREATED)

            # Return validation errors
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"detail": str(e), "message": "Registration failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class OccupierLoginView(APIView):
    """
    Login user with email and password, return JWT tokens and user data

    POST /api/auth/login/
    """

    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Handle user login with email or username.

        Args:
            request: The HTTP request containing login credentials

        Returns:
            Response with access token, refresh token, and user data
        """
        try:
            # Accept either email or username
            email_or_username: Optional[str] = request.data.get(
                "email"
            ) or request.data.get("username")
            password: Optional[str] = request.data.get("password", None)

            if not email_or_username or not password:
                return Response(
                    {"detail": "Email/username and password are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Authenticate user (works with email or username via custom backend)
            user: Optional[Occupier] = authenticate(
                request=request, username=email_or_username, password=password
            )

            if user:
                # Generate tokens
                tokens: Dict[str, str] = create_jwt_pair_for_user(user)

                # Get user data
                user_serializer = UserSerializer(user)

                # Return tokens and user data
                response_data: Dict[str, Any] = {
                    "access": tokens["access"],
                    "refresh": tokens["refresh"],
                    "user": user_serializer.data,
                }

                return Response(response_data, status=status.HTTP_200_OK)

            return Response(
                {
                    "detail": "Invalid credentials. Please check your email and password."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        except Exception as e:
            return Response(
                {"detail": str(e), "message": "Login failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class CurrentUserView(APIView):
    """
    Get or update current authenticated user's data

    GET /api/auth/users/me/
    PATCH /api/auth/users/me/
    PUT /api/auth/users/me/
    """

    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Get current authenticated user's data.

        Args:
            request: The HTTP request with authentication headers

        Returns:
            Response with user data
        """
        try:
            serializer = self.serializer_class(request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": str(e), "message": "Failed to retrieve user data"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def patch(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Partially update current user's profile.

        Args:
            request: The HTTP request with updated user data

        Returns:
            Response with updated user data
        """
        try:
            serializer = self.serializer_class(
                request.user, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"detail": str(e), "message": "Failed to update profile"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Fully update current user's profile.

        Args:
            request: The HTTP request with complete user data

        Returns:
            Response with updated user data
        """
        try:
            serializer = self.serializer_class(request.user, data=request.data)

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"detail": str(e), "message": "Failed to update profile"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class MyTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view that returns user data along with tokens

    POST /api/auth/jwt/create/
    """

    serializer_class = MyTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Authenticate user and return JWT tokens with user data.

        Args:
            request: The HTTP request with login credentials

        Returns:
            Response with access token, refresh token, and user data
        """
        try:
            serializer = self.get_serializer(data=request.data)

            if serializer.is_valid():
                # Get the validated data which includes tokens
                response_data: Dict[str, Any] = serializer.validated_data

                # The user data is already added in the serializer's validate method
                return Response(response_data, status=status.HTTP_200_OK)

            # Handle validation errors
            errors: Dict[str, Any] = serializer.errors

            # Format error message for better readability
            error_message: str
            if "non_field_errors" in errors:
                error_message = errors["non_field_errors"][0]
            elif "detail" in errors:
                error_message = errors["detail"]
            else:
                error_message = "Authentication failed"

            return Response(
                {"detail": error_message},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        except Exception as e:
            return Response(
                {"detail": str(e), "message": "Authentication failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(APIView):
    """
    Logout user by blacklisting the refresh token

    POST /api/auth/logout/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Logout user by blacklisting their refresh token.

        Args:
            request: The HTTP request with refresh token

        Returns:
            Response confirming successful logout
        """
        try:
            refresh_token: Optional[str] = request.data.get(
                "refresh_token"
            ) or request.data.get("refresh")

            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Blacklist the refresh token
            token: RefreshToken = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"detail": "Successfully logged out"},
                status=status.HTTP_205_RESET_CONTENT,
            )

        except Exception as e:
            return Response(
                {"detail": str(e), "message": "Logout failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
