"""
Views for the accounts app.
"""

from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404

from .models import User, BlockedUser
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    UserDetailSerializer,
    UserListSerializer,
    BlockedUserSerializer,
)


class UserRegistrationView(generics.CreateAPIView):
    """View for user registration."""

    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        """Create a new user and return tokens."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        tokens = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

        return Response(
            {
                "message": "User created successfully",
                "user": UserProfileSerializer(user).data,
                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class UserLoginView(APIView):
    """View for user login."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Authenticate user and return tokens."""
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        tokens = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }

        return Response(
            {
                "message": "Login successful",
                "user": UserProfileSerializer(user).data,
                "tokens": tokens,
            },
            status=status.HTTP_200_OK,
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view."""

    serializer_class = CustomTokenObtainPairSerializer


class UserLogoutView(APIView):
    """View for user logout."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Blacklist the refresh token."""
        try:
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            return Response(
                {"message": "Successfully logged out"},
                status=status.HTTP_205_RESET_CONTENT,
            )

        except Exception:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for user profile management."""

    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Return the current user."""
        return self.request.user


class UserDetailView(generics.RetrieveAPIView):
    """View for retrieving user details by username."""

    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    lookup_field = "username"
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Filter out blocked users."""
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            # Exclude users that have blocked the current user
            queryset = queryset.exclude(blocked_users__blocked=self.request.user)
        return queryset


class UserListView(generics.ListAPIView):
    """View for listing users."""

    queryset = User.objects.filter(is_active=True)
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["is_business_account"]
    search_fields = ["username", "first_name", "last_name", "occupations"]
    ordering_fields = ["username", "date_joined"]
    ordering = ["-date_joined"]

    def get_queryset(self):
        """Filter out blocked users and private accounts."""
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            # Exclude users that have blocked the current user
            queryset = queryset.exclude(blocked_users__blocked=self.request.user)
            # Exclude private accounts (unless following)
            # This would need to be implemented when follow functionality is added
        return queryset


class BlockedUserListView(generics.ListCreateAPIView):
    """View for managing blocked users."""

    serializer_class = BlockedUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return blocked users for the current user."""
        return BlockedUser.objects.filter(blocker=self.request.user)


class BlockedUserDetailView(generics.RetrieveDestroyAPIView):
    """View for managing individual blocked user relationships."""

    serializer_class = BlockedUserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Return blocked users for the current user."""
        return BlockedUser.objects.filter(blocker=self.request.user)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def current_user_view(request):
    """Get current user information."""
    serializer = UserDetailSerializer(request.user)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """Change user password."""
    user = request.user
    old_password = request.data.get("old_password")
    new_password = request.data.get("new_password")

    if not old_password or not new_password:
        return Response(
            {"error": "Both old_password and new_password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user.check_password(old_password):
        return Response(
            {"error": "Invalid old password"}, status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.save()

    return Response(
        {"message": "Password changed successfully"}, status=status.HTTP_200_OK
    )
