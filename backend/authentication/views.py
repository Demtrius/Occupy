"""
Authentication Views

This module provides API views for user authentication, registration, and profile management.
All views include comprehensive type annotations for better code clarity and IDE support.
"""

from typing import Any, Dict, Optional
import jwt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.conf import settings

from .backends import CustomJWTAuthentication
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    LogoutSerializer,
    MyTokenObtainPairSerializer,
    UserSerializer,
)
from users.models import Occupier
from django.contrib.auth import authenticate
from .utils import create_jwt_pair_for_user
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema


@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(APIView):
    """
    Register a new user and return JWT tokens with user data

    POST /api/auth/users/
    """

    tags = ["Authentication"]
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(tags=['Authentication'])
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

    tags = ["Authentication"]
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(tags=['Authentication'])
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

    tags = ["Authentication"]
    permission_classes = [IsAuthenticated]
    authentication_classes = [CustomJWTAuthentication]

    @swagger_auto_schema(tags=['Authentication'])
    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Get current authenticated user's data.

        Args:
            request: The HTTP request with authentication headers

        Returns:
            Response with user data
        """
        serializer = self.serializer_class(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(tags=['Authentication'])
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

    @swagger_auto_schema(tags=['Authentication'])
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
class MyTokenObtainPairView(APIView):
    """
    Custom JWT token obtain view that returns user data along with tokens

    POST /api/auth/jwt/create/
    """

    tags = ["Authentication"]
    serializer_class = MyTokenObtainPairSerializer
    permission_classes = [AllowAny]

    @swagger_auto_schema(tags=['Authentication'])
    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Authenticate user and return JWT tokens with user data.

        Args:
            request: The HTTP request with login credentials

        Returns:
            Response with access token, refresh token, and user data
        """
        try:
            serializer = self.serializer_class(data=request.data)

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
class MyTokenRefreshView(APIView):
    """
    Custom JWT token refresh view

    POST /api/auth/jwt/refresh/
    """

    tags = ["Authentication"]
    permission_classes = [AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Refresh access token using refresh token.

        Args:
            request: The HTTP request with refresh token

        Returns:
            Response with new access token
        """
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate refresh token
            try:
                payload = jwt.decode(
                    refresh_token, settings.SECRET_KEY, algorithms=["HS256"]
                )
            except jwt.ExpiredSignatureError:
                return Response(
                    {"detail": "Refresh token has expired"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            except jwt.InvalidTokenError:
                return Response(
                    {"detail": "Invalid refresh token"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Check if refresh token
            if payload.get("token_type") != "refresh":
                return Response(
                    {"detail": "Invalid token type"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Check if blacklisted
            from .models import BlacklistedToken

            if BlacklistedToken.is_blacklisted(refresh_token):
                return Response(
                    {"detail": "Token has been blacklisted"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Get user
            user_id = payload.get("user_id")
            try:
                from users.models import Occupier

                user = Occupier.objects.get(id=user_id)
            except Occupier.DoesNotExist:
                return Response(
                    {"detail": "User not found"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Generate new access token
            from .utils import create_jwt_pair_for_user

            tokens = create_jwt_pair_for_user(user)

            return Response(
                {
                    "access": tokens["access"],
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"detail": str(e), "message": "Token refresh failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class MyTokenVerifyView(APIView):
    """
    Custom JWT token verify view

    POST /api/auth/jwt/verify/
    """

    tags = ["Authentication"]
    permission_classes = [AllowAny]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """
        Verify if an access token is valid.

        Args:
            request: The HTTP request with token

        Returns:
            Response confirming token validity
        """
        try:
            token = request.data.get("token")
            if not token:
                return Response(
                    {"detail": "Token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate token
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            except jwt.ExpiredSignatureError:
                return Response(
                    {"detail": "Token has expired"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            except jwt.InvalidTokenError:
                return Response(
                    {"detail": "Invalid token"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            # Check if it's an access token
            if payload.get("token_type") != "access":
                return Response(
                    {"detail": "Invalid token type"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            return Response({"detail": "Token is valid"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"detail": str(e), "message": "Token verification failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(APIView):
    """
    Logout user by blacklisting the refresh token

    POST /api/auth/logout/
    """

    tags = ["Authentication"]

    permission_classes = [AllowAny]

    @swagger_auto_schema(tags=['Authentication'])
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
            from .models import BlacklistedToken
            from datetime import datetime, timedelta

            # Calculate expiration (assuming 24 hours from now for refresh tokens)
            expires_at = datetime.utcnow() + timedelta(days=1)
            BlacklistedToken.blacklist_token(refresh_token, expires_at)

        except Exception as e:
            return Response(
                {"detail": str(e), "message": "Logout failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )
