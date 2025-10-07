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
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
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
from core.models import Follow
from django.contrib.auth import authenticate
from .utils import create_jwt_pair_for_user
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


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
class MyTokenRefreshView(TokenRefreshView):
    """
    Custom JWT token refresh view with CSRF exemption

    POST /api/auth/jwt/refresh/
    """
    pass


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

        except Exception as e:
            return Response(
                {"detail": str(e), "message": "Logout failed"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def follow_user(request, user_id):
    """
    Follow a user.
    """
    try:
        user_to_follow = Occupier.objects.get(id=user_id)
    except Occupier.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if user_to_follow == request.user:
        return Response(
            {"error": "You cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST
        )

    # Check if already following
    if Follow.objects.filter(follower=request.user, followed=user_to_follow).exists():
        return Response(
            {"error": "You are already following this user"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create follow relationship
    Follow.objects.create(follower=request.user, followed=user_to_follow)

    # Get updated followers count
    followers_count = Follow.objects.filter(followed=user_to_follow).count()

    return Response(
        {
            "message": "Successfully followed user",
            "is_following": True,
            "followers_count": followers_count,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unfollow_user(request, user_id):
    """
    Unfollow a user.
    """
    try:
        user_to_unfollow = Occupier.objects.get(id=user_id)
    except Occupier.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if user_to_unfollow == request.user:
        return Response(
            {"error": "You cannot unfollow yourself"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Find and delete follow relationship
    follow_obj = Follow.objects.filter(
        follower=request.user, followed=user_to_unfollow
    ).first()
    if not follow_obj:
        return Response(
            {"error": "You are not following this user"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    follow_obj.delete()

    # Get updated followers count
    followers_count = Follow.objects.filter(followed=user_to_unfollow).count()

    return Response(
        {
            "message": "Successfully unfollowed user",
            "is_following": False,
            "followers_count": followers_count,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def is_following(request, user_id):
    """
    Check if current user is following the specified user.
    """
    try:
        user_to_check = Occupier.objects.get(id=user_id)
    except Occupier.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if user_to_check == request.user:
        return Response({"is_following": False})

    is_following = Follow.objects.filter(
        follower=request.user, followed=user_to_check
    ).exists()

    return Response({"is_following": is_following})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_stats(request, user_id):
    """
    Get user statistics (followers, following, posts, cliques).
    """
    try:
        target_user = Occupier.objects.get(id=user_id)
        # Use Follow model for proper follower/following counts
        followers_count = Follow.objects.filter(followed=target_user).count()
        following_count = Follow.objects.filter(follower=target_user).count()
        # TODO: Get posts and cliques counts from proper models
        posts_count = 0  # TODO: Get from Post model
        cliques_count = 0  # TODO: Get from Clique model

        return Response(
            {
                "followers_count": followers_count,
                "following_count": following_count,
                "posts_count": posts_count,
                "cliques_count": cliques_count,
            }
        )
    except Occupier.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"DEBUG: user_stats error: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_user_by_id(request, user_id):
    """
    Get user by ID.
    """
    try:
        user = Occupier.objects.get(id=user_id)
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except Occupier.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_occupations(request):
    """
    Get list of possible occupations.
    """
    occupations = [
        "Software Developer",
        "Designer",
        "Marketing Manager",
        "Sales Representative",
        "Project Manager",
        "Data Analyst",
        "Teacher",
        "Nurse",
        "Engineer",
        "Accountant",
        "Lawyer",
        "Doctor",
        "Chef",
        "Electrician",
        "Plumber",
        "Mechanic",
        "Carpenter",
        "Photographer",
        "Writer",
        "Artist",
        "Musician",
        "Actor",
        "Athlete",
        "Scientist",
        "Researcher",
        "Consultant",
        "Entrepreneur",
        "Freelancer",
        "Other",
    ]
    return Response({"occupations": occupations})
