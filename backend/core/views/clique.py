"""
Views for Clique model.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.pagination import PageNumberPagination
from django.db.models import QuerySet, Exists, OuterRef

from authentication.backends import CustomJWTAuthentication
from ..models import Clique


class CliquePagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "limit"
from ..serializers import (
    CliqueListSerializer,
    CliqueDetailSerializer,
    CliqueCreateUpdateSerializer,
    UserBasicSerializer,
    PostListSerializer,
)


class CliqueViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing cliques.

    Provides CRUD operations for cliques with filtering, search, and ordering.
    """

    tags = ['Cliques']
    queryset = Clique.objects.prefetch_related("members", "posts")
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    authentication_classes = [CustomJWTAuthentication]
    pagination_class = CliquePagination
    filter_backends = []  # Will be imported if needed
    search_fields = ["name", "description"]
    ordering_fields = ["created", "name"]
    ordering = ["-created"]


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

        # Annotate is_member for authenticated users
        if self.request.user.is_authenticated:
            queryset = queryset.annotate(
                is_member=Exists(
                    Clique.members.through.objects.filter(
                        clique_id=OuterRef('pk'),
                        occupier_id=self.request.user.id
                    )
                )
            )

        # Filter by visibility
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(level=Clique.Type.PUBLIC)

        # Filter by membership if requested
        is_member = self.request.query_params.get("is_member")
        if is_member and self.request.user.is_authenticated:
            if is_member.lower() == "true":
                queryset = queryset.filter(members=self.request.user)

        # Filter by owner
        owner_id = self.request.query_params.get("owner_id")
        if owner_id:
            queryset = queryset.filter(occupier_id=owner_id)

        return queryset.distinct()

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
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to delete this clique.")
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
        if clique.level != Clique.Type.PUBLIC:
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
                {"detail": "Clique owner cannot leave. Transfer ownership or delete the clique."},
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

        serializer = UserBasicSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def posts(self, request: Request, pk: int = None) -> Response:
        """Get all posts in a clique."""
        clique = self.get_object()
        posts = (
            clique.posts.filter(status="posted")
            .select_related("occupier", "clique")
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

    @action(
        detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated]
    )
    def my_cliques(self, request: Request) -> Response:
        """Get all cliques the current user is a member of."""
        user = request.user
        cliques = user.cliques.select_related("occupier").prefetch_related("members").all()
        serializer = CliqueListSerializer(
            cliques, many=True, context={"request": request}
        )
        return Response(serializer.data)