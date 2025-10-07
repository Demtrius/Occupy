"""
ViewSets for the core app (Posts and Cliques).
"""

from typing import Any
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework.pagination import PageNumberPagination
from django.db.models import QuerySet, Q
from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    Post,
    Clique,
    CommentPost,
    Like,
    Review,
    Service,
    Availability,
    Booking,
)
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    PostCreateUpdateSerializer,
    CliqueListSerializer,
    CliqueDetailSerializer,
    CliqueCreateUpdateSerializer,
    CommentSerializer,
    LikeSerializer,
    ReviewSerializer,
    ServiceListSerializer,
    ServiceDetailSerializer,
    ServiceCreateUpdateSerializer,
    AvailabilitySerializer,
    BookingListSerializer,
    BookingDetailSerializer,
    BookingCreateSerializer,
)

User = get_user_model()


class CliquePostsPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'limit'


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
    pagination_class = CliquePostsPagination

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
        user = request.user

        # Check if already liked
        existing_like = Like.objects.filter(post=post, user=user).first()
        if existing_like:
            return Response(
                {"detail": "You have already liked this post."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the like
        Like.objects.create(post=post, user=user)

        # Return updated like count and status
        likes_count = Like.objects.filter(post=post).count()
        return Response(
            {
                "detail": "Post liked successfully.",
                "likes_count": likes_count,
                "is_liked": True,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["delete"],
        permission_classes=[permissions.IsAuthenticated],
    )
    def unlike(self, request: Request, pk: int = None) -> Response:
        """Unlike a post."""
        post = self.get_object()
        user = request.user

        # Find and delete the like
        like = Like.objects.filter(post=post, user=user).first()
        if not like:
            return Response(
                {"detail": "You have not liked this post."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        like.delete()

        # Return updated like count and status
        likes_count = Like.objects.filter(post=post).count()
        return Response(
            {
                "detail": "Post unliked successfully.",
                "likes_count": likes_count,
                "is_liked": False,
            },
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
        # Get cliques user is a member of or owns
        user_cliques = Clique.objects.filter(
            Q(members=user) | Q(occupier=user)
        ).distinct()

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
    pagination_class = CliquePostsPagination

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


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing services in cliques.

    Provides CRUD operations for services offered by business cliques.
    """

    queryset = Service.objects.select_related("clique", "provider").all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["clique", "provider", "is_active"]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "price", "duration_minutes"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "list":
            return ServiceListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return ServiceCreateUpdateSerializer
        return ServiceDetailSerializer

    def get_queryset(self) -> QuerySet:
        """Get queryset with optional filtering."""
        queryset = super().get_queryset()

        # Filter by clique
        clique_id = self.request.query_params.get("clique_id")
        if clique_id:
            queryset = queryset.filter(clique_id=clique_id)

        # Filter by active status
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset

    def perform_create(self, serializer) -> None:
        """Create a service with the current user as provider."""
        serializer.save(provider=self.request.user)

    def perform_update(self, serializer) -> None:
        """Update a service (only by the owner)."""
        instance = self.get_object()
        if instance.provider != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "You can only update your own services."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer.save()

    def perform_destroy(self, instance: Service) -> None:
        """Delete a service (only by owner or admin)."""
        if instance.provider != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "You don't have permission to delete this service."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance.delete()


class AvailabilityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing availability slots.

    Service providers can set their availability for bookings.
    """

    queryset = Availability.objects.select_related("clique", "provider").all()
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["clique", "provider", "date", "day_of_week", "is_recurring"]
    ordering_fields = ["date", "start_time"]
    ordering = ["date", "start_time"]

    def get_queryset(self) -> QuerySet:
        """Get queryset with optional filtering."""
        queryset = super().get_queryset()

        # Filter by clique
        clique_id = self.request.query_params.get("clique_id")
        if clique_id:
            queryset = queryset.filter(clique_id=clique_id)

        # Filter by date range
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date and end_date:
            queryset = queryset.filter(date__gte=start_date, date__lte=end_date)

        return queryset

    def perform_create(self, serializer) -> None:
        """Create availability with the current user as provider."""
        serializer.save(provider=self.request.user)

    def perform_update(self, serializer) -> None:
        """Update availability (only by the owner)."""
        instance = self.get_object()
        if instance.provider != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "You can only update your own availability."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer.save()

    def perform_destroy(self, instance: Availability) -> None:
        """Delete availability (only by owner or admin)."""
        if instance.provider != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "You don't have permission to delete this availability."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance.delete()


class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bookings.

    Clients can book services and providers can manage bookings.
    """

    queryset = Booking.objects.select_related(
        "service", "clique", "client", "provider"
    ).all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["clique", "service", "client", "provider", "status", "date"]
    ordering_fields = ["created_at", "date", "start_time"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "list":
            return BookingListSerializer
        elif self.action == "create":
            return BookingCreateSerializer
        return BookingDetailSerializer

    def get_queryset(self) -> QuerySet:
        """
        Get queryset filtered by user role.

        Clients see their own bookings.
        Providers see bookings for their services.
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Filter based on role
        role = self.request.query_params.get("role")
        if role == "client":
            queryset = queryset.filter(client=user)
        elif role == "provider":
            queryset = queryset.filter(provider=user)
        else:
            # Default: show both client and provider bookings
            queryset = queryset.filter(Q(client=user) | Q(provider=user))

        return queryset

    def perform_create(self, serializer) -> None:
        """Create a booking with the current user as client."""
        serializer.save(client=self.request.user)

    def perform_update(self, serializer) -> None:
        """Update a booking (clients and providers have different permissions)."""
        instance = self.get_object()
        user = self.request.user

        # Only client or provider can update
        if instance.client != user and instance.provider != user and not user.is_staff:
            return Response(
                {"detail": "You don't have permission to update this booking."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer.save()

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def confirm(self, request: Request, pk: int = None) -> Response:
        """Confirm a booking (provider only)."""
        booking = self.get_object()

        if booking.provider != request.user and not request.user.is_staff:
            return Response(
                {"detail": "Only the service provider can confirm bookings."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if booking.status != "pending":
            return Response(
                {"detail": "Only pending bookings can be confirmed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = "confirmed"
        booking.save()

        serializer = BookingDetailSerializer(booking, context={"request": request})
        return Response(serializer.data)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def cancel(self, request: Request, pk: int = None) -> Response:
        """Cancel a booking (client or provider)."""
        booking = self.get_object()

        if (
            booking.client != request.user
            and booking.provider != request.user
            and not request.user.is_staff
        ):
            return Response(
                {"detail": "You don't have permission to cancel this booking."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if booking.status == "cancelled":
            return Response(
                {"detail": "Booking is already cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = "cancelled"
        booking.cancellation_reason = request.data.get("reason", "")
        booking.save()

        serializer = BookingDetailSerializer(booking, context={"request": request})
        return Response(serializer.data)

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def complete(self, request: Request, pk: int = None) -> Response:
        """Mark a booking as completed (provider only)."""
        booking = self.get_object()

        if booking.provider != request.user and not request.user.is_staff:
            return Response(
                {"detail": "Only the service provider can mark bookings as completed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if booking.status != "confirmed":
            return Response(
                {"detail": "Only confirmed bookings can be marked as completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = "completed"
        booking.save()

        serializer = BookingDetailSerializer(booking, context={"request": request})
        return Response(serializer.data)


class LikeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing post likes.

    Provides endpoints for liking and unliking posts.
    """

    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self) -> QuerySet[Like]:
        """Return likes, optionally filtered by post."""
        queryset = Like.objects.select_related("user", "post").all()

        # Filter by post if provided
        post_id = self.request.query_params.get("post")
        if post_id:
            queryset = queryset.filter(post_id=post_id)

        return queryset

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        """Create a like for a post."""
        post_id = request.data.get("post")

        if not post_id:
            return Response(
                {"detail": "Post ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if already liked
        existing_like = Like.objects.filter(post_id=post_id, user=request.user).first()

        if existing_like:
            return Response(
                {"detail": "You have already liked this post."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create the like
        like = Like.objects.create(post_id=post_id, user=request.user)

        serializer = self.get_serializer(like)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["delete"], url_path="(?P<post_id>[^/.]+)/unlike")
    def unlike(self, request: Request, post_id: str = None) -> Response:
        """Unlike a post."""
        try:
            like = Like.objects.get(post_id=post_id, user=request.user)
            like.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Like.DoesNotExist:
            return Response(
                {"detail": "Like not found."},
                status=status.HTTP_404_NOT_FOUND,
            )


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing post comments.

    Provides CRUD operations for comments with filtering by post.
    """

    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["post"]
    ordering_fields = ["date", "id"]
    ordering = ["-date"]

    def get_queryset(self) -> QuerySet[CommentPost]:
        """Return comments, optionally filtered by post."""
        return CommentPost.objects.select_related("occupier", "post").all()

    def perform_create(self, serializer: CommentSerializer) -> None:
        """Save the comment with the authenticated user as the occupier."""
        serializer.save(occupier=self.request.user)

    def perform_update(self, serializer: CommentSerializer) -> None:
        """Update comment only if user is the owner."""
        if serializer.instance.occupier != self.request.user:
            raise permissions.PermissionDenied("You can only edit your own comments.")
        serializer.save()

    def perform_destroy(self, instance: CommentPost) -> None:
        """Delete comment only if user is the owner."""
        if instance.occupier != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own comments.")
        instance.delete()


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reviews.

    Provides CRUD operations for reviews with filtering by clique, booking, and user.
    """

    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["clique", "booking", "rating"]
    ordering_fields = ["created_at", "rating"]
    ordering = ["-created_at"]

    def get_queryset(self) -> QuerySet[Review]:
        """Return reviews, optionally filtered."""
        queryset = Review.objects.select_related("user", "booking", "clique").all()

        # Filter by user's own reviews
        if self.request.query_params.get("user") == "me":
            queryset = queryset.filter(user=self.request.user)

        return queryset

    def perform_update(self, serializer: ReviewSerializer) -> None:
        """Update review only if user is the owner."""
        if serializer.instance.user != self.request.user:
            raise permissions.PermissionDenied("You can only edit your own reviews.")
        serializer.save()

    def perform_destroy(self, instance: Review) -> None:
        """Delete review only if user is the owner."""
        if instance.user != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own reviews.")
        instance.delete()
