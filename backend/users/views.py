"""
ViewSets for the users app.
"""

from typing import Any, List, Dict
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.request import Request
from django.db.models import QuerySet, Count, Q
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .serializers import (
    UserListSerializer,
    UserDetailSerializer,
    UserUpdateSerializer,
    OccupationSerializer,
)
from .models import Follow

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users.

    Provides CRUD operations for users with filtering, search, and ordering.
    """

    tags = ['Users']
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["is_business_page", "occupations"]
    search_fields = ["username", "email", "occupations", "first_name", "last_name"]
    ordering_fields = ["created", "username"]
    ordering = ["-created"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "list":
            return UserListSerializer
        elif self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        return UserDetailSerializer

    def get_queryset(self) -> QuerySet:
        """Get queryset with optional filtering."""
        queryset = super().get_queryset().filter(is_active=True)

        # Filter by business pages
        is_business = self.request.query_params.get("is_business")
        if is_business:
            queryset = queryset.filter(is_business_page=True)

        # Filter by occupation
        occupation = self.request.query_params.get("occupation")
        if occupation:
            queryset = queryset.filter(occupations__icontains=occupation)

        return queryset

    def get_permissions(self):
        """
        Set permissions based on action.
        """
        if self.action in ["update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def update(self, request: Request, *args, **kwargs) -> Response:
        """Update user profile (only own profile)."""
        instance = self.get_object()

        # Users can only update their own profile (unless staff)
        if instance != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You can only update your own profile."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """Prevent deletion of users via API."""
        return Response(
            {"detail": "User deletion is not allowed via API."},
            status=status.HTTP_403_FORBIDDEN,
        )

    @action(detail=False, methods=["get"])
    def search(self, request: Request) -> Response:
        """
        Search users by query string.

        Query params:
            q: Search query
        """
        query = request.query_params.get("q", "")

        if not query:
            return Response(
                {"detail": "Please provide a search query (q parameter)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        users = User.objects.filter(
            Q(username__icontains=query)
            | Q(email__icontains=query)
            | Q(occupations__icontains=query)
            | Q(first_name__icontains=query)
            | Q(last_name__icontains=query),
            is_active=True,
        )[
            :20
        ]  # Limit to 20 results

        serializer = UserListSerializer(users, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def occupations(self, request: Request) -> Response:
        """
        Get all unique occupations from users.

        Returns a list of occupation objects with user counts.
        """
        # Get all unique occupations
        occupations = (
            User.objects.filter(is_active=True)
            .exclude(occupations="")
            .values("occupations")
            .annotate(user_count=Count("id"))
            .order_by("-user_count")
        )

        # Format response
        occupation_list = []
        seen = set()

        for idx, item in enumerate(occupations):
            occupation_name = item["occupations"].strip()

            # Skip duplicates (case-insensitive)
            if occupation_name.lower() in seen:
                continue

            seen.add(occupation_name.lower())

            occupation_list.append(
                {
                    "id": idx + 1,
                    "name": occupation_name,
                    "category": "General",  # Can be extended later
                    "user_count": item["user_count"],
                }
            )

        serializer = OccupationSerializer(occupation_list, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def search_occupations(self, request: Request) -> Response:
        """
        Search occupations by query string.

        Query params:
            q: Search query
        """
        query = request.query_params.get("q", "")

        if not query:
            return Response(
                {"detail": "Please provide a search query (q parameter)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get occupations matching the query
        occupations = (
            User.objects.filter(occupations__icontains=query, is_active=True)
            .exclude(occupations="")
            .values("occupations")
            .annotate(user_count=Count("id"))
            .order_by("-user_count")
        )

        # Format response
        occupation_list = []
        seen = set()

        for idx, item in enumerate(occupations):
            occupation_name = item["occupations"].strip()

            # Skip duplicates (case-insensitive)
            if occupation_name.lower() in seen:
                continue

            seen.add(occupation_name.lower())

            occupation_list.append(
                {
                    "id": idx + 1,
                    "name": occupation_name,
                    "category": "General",
                    "user_count": item["user_count"],
                }
            )

        serializer = OccupationSerializer(occupation_list, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def posts(self, request: Request, pk: int = None) -> Response:
        """Get all posts by a user."""
        user = self.get_object()

        from core.serializers import PostListSerializer

        posts = (
            user.posts.filter(status="posted")
            .select_related("clique")
            .order_by("-created")
        )

        # Paginate
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostListSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = PostListSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def stats(self, request: Request, pk: int = None) -> Response:
        """Get user statistics."""
        user = self.get_object()

        # Get follower and following counts using the Follow model
        followers_count = Follow.objects.filter(followed=user).count()
        following_count = Follow.objects.filter(follower=user).count()

        stats = {
            "followers_count": followers_count,
            "following_count": following_count,
            "posts_count": user.posts.count() if hasattr(user, "posts") else 0,
            "cliques_count": user.cliques.count() if hasattr(user, "cliques") else 0,
        }

        return Response(stats)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def follow(self, request: Request, pk: int = None) -> Response:
        """Follow a user."""
        user = self.get_object()

        if user == request.user:
            return Response(
                {"detail": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if already following
        if Follow.objects.filter(follower=request.user, followed=user).exists():
            return Response(
                {"detail": "You are already following this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create follow relationship
        Follow.objects.create(follower=request.user, followed=user)

        return Response(
            {
                "detail": "Successfully followed user",
                "is_following": True,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["delete"],
        permission_classes=[permissions.IsAuthenticated],
    )
    def unfollow(self, request: Request, pk: int = None) -> Response:
        """Unfollow a user."""
        user = self.get_object()

        if user == request.user:
            return Response(
                {"detail": "You cannot unfollow yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find and delete follow relationship
        follow_obj = Follow.objects.filter(
            follower=request.user, followed=user
        ).first()
        if not follow_obj:
            return Response(
                {"detail": "You are not following this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        follow_obj.delete()

        return Response(
            {
                "detail": "Successfully unfollowed user",
                "is_following": False,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def is_following(self, request: Request, pk: int = None) -> Response:
        """Check if current user is following this user."""
        user = self.get_object()

        is_following = Follow.objects.filter(
            follower=request.user, followed=user
        ).exists()

        return Response({"is_following": is_following})

    @action(detail=True, methods=["get"])
    def followers(self, request: Request, pk: int = None) -> Response:
        """Get user's followers."""
        user = self.get_object()

        followers = Follow.objects.filter(followed=user).select_related("follower")
        serializer = UserListSerializer([f.follower for f in followers], many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def following(self, request: Request, pk: int = None) -> Response:
        """Get users that this user is following."""
        user = self.get_object()

        following = Follow.objects.filter(follower=user).select_related("followed")
        serializer = UserListSerializer([f.followed for f in following], many=True, context={"request": request})
        return Response(serializer.data)

    @action(
        detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def suggested(self, request: Request) -> Response:
        """Get suggested users to follow."""
        # Simple suggestion: users with similar occupations
        user = request.user

        suggested_users = (
            User.objects.filter(occupations__icontains=user.occupations, is_active=True)
            .exclude(id=user.id)
            .order_by("?")[:10]  # Random 10 users
        )

        serializer = UserListSerializer(
            suggested_users, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def occupations(self, request: Request) -> Response:
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
