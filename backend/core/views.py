"""
ViewSets for the core app (Posts and Cliques).
"""

from typing import Any
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.request import Request
from django.db.models import QuerySet, Q
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Post, Clique, CommentPost
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    PostCreateUpdateSerializer,
    CliqueListSerializer,
    CliqueDetailSerializer,
    CliqueCreateUpdateSerializer,
    CommentSerializer,
)

User = get_user_model()


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing posts.

    Provides CRUD operations for posts with filtering, search, and ordering.
    """

    queryset = Post.objects.select_related("occupier", "clique").prefetch_related(
        "comments"
    )
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["clique", "occupier", "status"]
    search_fields = ["content", "caption"]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "list":
            return PostListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return PostCreateUpdateSerializer
        return PostDetailSerializer

    def get_queryset(self) -> QuerySet:
        """
        Get queryset with optional filtering.

        Returns only published posts for unauthenticated users.
        """
        queryset = super().get_queryset()

        # Filter by status
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status="posted")

        # Filter by clique if provided
        clique_id = self.request.query_params.get("clique_id")
        if clique_id:
            queryset = queryset.filter(clique_id=clique_id)

        # Filter by user if provided
        user_id = self.request.query_params.get("user_id")
        if user_id:
            queryset = queryset.filter(occupier_id=user_id)

        return queryset

    def perform_create(self, serializer) -> None:
        """Create a post with the current user as the occupier."""
        serializer.save(occupier=self.request.user)

    def perform_update(self, serializer) -> None:
        """Update a post (only by the owner)."""
        serializer.save()

    def perform_destroy(self, instance: Post) -> None:
        """Delete a post (only by the owner or admin)."""
        if instance.occupier != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "You don't have permission to delete this post."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance.delete()

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def like(self, request: Request, pk: int = None) -> Response:
        """Like a post."""
        post = self.get_object()
        # TODO: Implement like functionality when Like model is added
        return Response(
            {"detail": "Like functionality will be implemented soon."},
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["delete"],
        permission_classes=[permissions.IsAuthenticated],
    )
    def unlike(self, request: Request, pk: int = None) -> Response:
        """Unlike a post."""
        post = self.get_object()
        # TODO: Implement unlike functionality when Like model is added
        return Response(
            {"detail": "Unlike functionality will be implemented soon."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"])
    def comments(self, request: Request, pk: int = None) -> Response:
        """Get all comments for a post."""
        post = self.get_object()
        comments = post.comments.select_related("occupier").all()
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def add_comment(self, request: Request, pk: int = None) -> Response:
        """Add a comment to a post."""
        post = self.get_object()
        serializer = CommentSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            serializer.save(post=post, occupier=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def feed(self, request: Request) -> Response:
        """
        Get personalized feed of posts from cliques the user is a member of.
        """
        user = request.user
        # Get cliques user is a member of
        user_cliques = user.cliques.all()

        # Get posts from those cliques
        posts = (
            Post.objects.filter(clique__in=user_cliques, status="posted")
            .select_related("occupier", "clique")
            .order_by("-created_at")
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


class CliqueViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing cliques.

    Provides CRUD operations for cliques with filtering, search, and ordering.
    """

    queryset = Clique.objects.prefetch_related("members", "posts")
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["created_at", "name"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "list":
            return CliqueListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return CliqueCreateUpdateSerializer
        return CliqueDetailSerializer

    def get_queryset(self) -> QuerySet:
        """
        Get queryset with optional filtering.

        Returns only public cliques for unauthenticated users.
        """
        queryset = super().get_queryset()

        # Filter by visibility
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(is_public=True)

        # Filter by membership if requested
        is_member = self.request.query_params.get("is_member")
        if is_member and self.request.user.is_authenticated:
            if is_member.lower() == "true":
                queryset = queryset.filter(members=self.request.user)

        # Filter by owner
        owner_id = self.request.query_params.get("owner_id")
        if owner_id:
            queryset = queryset.filter(occupier_id=owner_id)

        return queryset

    def perform_create(self, serializer) -> None:
        """Create a clique with the current user as the occupier."""
        clique = serializer.save(occupier=self.request.user)
        # Add creator as a member
        clique.members.add(self.request.user)

    def perform_update(self, serializer) -> None:
        """Update a clique (only by the owner)."""
        serializer.save()

    def perform_destroy(self, instance: Clique) -> None:
        """Delete a clique (only by the owner or admin)."""
        if instance.occupier != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "You don't have permission to delete this clique."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance.delete()

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def join(self, request: Request, pk: int = None) -> Response:
        """Join a clique."""
        clique = self.get_object()
        user = request.user

        if clique.members.filter(id=user.id).exists():
            return Response(
                {"detail": "You are already a member of this clique."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if clique is private
        if not clique.is_public:
            # TODO: Implement invitation system for private cliques
            return Response(
                {"detail": "This is a private clique. You need an invitation to join."},
                status=status.HTTP_403_FORBIDDEN,
            )

        clique.members.add(user)
        return Response(
            {"detail": "Successfully joined the clique."},
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def leave(self, request: Request, pk: int = None) -> Response:
        """Leave a clique."""
        clique = self.get_object()
        user = request.user

        if not clique.members.filter(id=user.id).exists():
            return Response(
                {"detail": "You are not a member of this clique."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Don't allow owner to leave their own clique
        if clique.occupier == user:
            return Response(
                {
                    "detail": "Clique owner cannot leave. Transfer ownership or delete the clique."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        clique.members.remove(user)
        return Response(
            {"detail": "Successfully left the clique."},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["get"])
    def members(self, request: Request, pk: int = None) -> Response:
        """Get all members of a clique."""
        clique = self.get_object()
        members = clique.members.all()

        from .serializers import UserBasicSerializer

        serializer = UserBasicSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def posts(self, request: Request, pk: int = None) -> Response:
        """Get all posts in a clique."""
        clique = self.get_object()
        posts = (
            clique.posts.filter(status="posted")
            .select_related("occupier")
            .order_by("-created_at")
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

    @action(
        detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def my_cliques(self, request: Request) -> Response:
        """Get all cliques the current user is a member of."""
        user = request.user
        cliques = user.cliques.all()
        serializer = CliqueListSerializer(
            cliques, many=True, context={"request": request}
        )
        return Response(serializer.data)
