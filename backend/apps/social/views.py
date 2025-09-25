"""
Views for the social app.
"""

from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count

from .models import (
    Clique,
    CliqueMembership,
    Post,
    PostLike,
    Comment,
    CommentLike,
    Follow,
    Review,
)
from .serializers import (
    CliqueListSerializer,
    CliqueDetailSerializer,
    CliqueCreateUpdateSerializer,
    CliqueMembershipSerializer,
    PostListSerializer,
    PostDetailSerializer,
    PostCreateUpdateSerializer,
    CommentSerializer,
    CommentCreateUpdateSerializer,
    FollowSerializer,
    ReviewSerializer,
    ReviewCreateUpdateSerializer,
)
from .permissions import (
    IsAuthorOrReadOnly,
    IsCliqueMemberOrReadOnly,
    IsCliqueAdminOrReadOnly,
)
from .filters import PostFilter, CliqueFilter


class CliqueViewSet(viewsets.ModelViewSet):
    """ViewSet for managing cliques."""

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = CliqueFilter
    search_fields = ["name", "description", "occupation"]
    ordering_fields = ["name", "created_at", "member_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return cliques based on user permissions."""
        queryset = Clique.objects.select_related("creator").prefetch_related("members")

        if self.request.user.is_authenticated:
            # Show all public cliques and private cliques the user is a member of
            return (
                queryset.filter(
                    Q(privacy_level="public") | Q(members=self.request.user)
                )
                .annotate(member_count=Count("members"), post_count=Count("posts"))
                .distinct()
            )
        else:
            # Show only public cliques for anonymous users
            return queryset.filter(privacy_level="public").annotate(
                member_count=Count("members"), post_count=Count("posts")
            )

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ["create", "update", "partial_update"]:
            return CliqueCreateUpdateSerializer
        elif self.action == "retrieve":
            return CliqueDetailSerializer
        return CliqueListSerializer

    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [permissions.IsAuthenticated, IsCliqueAdminOrReadOnly]
        elif self.action == "create":
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]

        return [permission() for permission in permission_classes]

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def join(self, request, pk=None):
        """Join a clique."""
        clique = self.get_object()
        user = request.user

        # Check if already a member
        if clique.members.filter(id=user.id).exists():
            return Response(
                {"detail": "You are already a member of this clique."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check privacy level
        if clique.privacy_level == "private":
            return Response(
                {"detail": "This clique requires approval to join."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif clique.privacy_level == "invite_only":
            return Response(
                {"detail": "This clique is invite only."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Add user as member
        CliqueMembership.objects.create(user=user, clique=clique)

        return Response(
            {"detail": "Successfully joined the clique."}, status=status.HTTP_200_OK
        )

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def leave(self, request, pk=None):
        """Leave a clique."""
        clique = self.get_object()
        user = request.user

        try:
            membership = CliqueMembership.objects.get(user=user, clique=clique)

            # Don't allow creator to leave
            if clique.creator == user:
                return Response(
                    {"detail": "Clique creator cannot leave the clique."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            membership.delete()
            return Response(
                {"detail": "Successfully left the clique."}, status=status.HTTP_200_OK
            )
        except CliqueMembership.DoesNotExist:
            return Response(
                {"detail": "You are not a member of this clique."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        """Get clique members."""
        clique = self.get_object()
        memberships = CliqueMembership.objects.filter(
            clique=clique, is_active=True
        ).select_related("user")

        serializer = CliqueMembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def posts(self, request, pk=None):
        """Get posts in this clique."""
        clique = self.get_object()
        posts = (
            Post.objects.filter(clique=clique, is_published=True)
            .select_related("author", "clique")
            .prefetch_related("likes")
        )

        # Apply filters
        filterset = PostFilter(request.GET, queryset=posts)
        if filterset.is_valid():
            posts = filterset.qs

        # Paginate
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = PostListSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = PostListSerializer(posts, many=True, context={"request": request})
        return Response(serializer.data)


class PostViewSet(viewsets.ModelViewSet):
    """ViewSet for managing posts."""

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = PostFilter
    search_fields = ["content", "caption"]
    ordering_fields = ["created_at", "like_count"]
    ordering = ["-is_pinned", "-created_at"]

    def get_queryset(self):
        """Return posts based on user permissions."""
        queryset = Post.objects.select_related("author", "clique").prefetch_related(
            "likes"
        )

        if self.request.user.is_authenticated:
            # Show posts from public cliques and cliques the user is a member of
            return (
                queryset.filter(
                    Q(clique__privacy_level="public")
                    | Q(clique__members=self.request.user),
                    is_published=True,
                )
                .annotate(like_count=Count("likes"), comment_count=Count("comments"))
                .distinct()
            )
        else:
            # Show only posts from public cliques for anonymous users
            return queryset.filter(
                clique__privacy_level="public", is_published=True
            ).annotate(like_count=Count("likes"), comment_count=Count("comments"))

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ["create", "update", "partial_update"]:
            return PostCreateUpdateSerializer
        elif self.action == "retrieve":
            return PostDetailSerializer
        return PostListSerializer

    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]
        elif self.action == "create":
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]

        return [permission() for permission in permission_classes]

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def like(self, request, pk=None):
        """Like or unlike a post."""
        post = self.get_object()
        user = request.user

        like, created = PostLike.objects.get_or_create(user=user, post=post)

        if not created:
            like.delete()
            return Response(
                {"detail": "Post unliked.", "liked": False}, status=status.HTTP_200_OK
            )

        return Response(
            {"detail": "Post liked.", "liked": True}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["get"])
    def comments(self, request, pk=None):
        """Get comments for this post."""
        post = self.get_object()
        comments = (
            Comment.objects.filter(post=post, parent=None, is_active=True)
            .select_related("author")
            .prefetch_related("likes", "replies")
        )

        # Paginate
        page = self.paginate_queryset(comments)
        if page is not None:
            serializer = CommentSerializer(
                page, many=True, context={"request": request}
            )
            return self.get_paginated_response(serializer.data)

        serializer = CommentSerializer(
            comments, many=True, context={"request": request}
        )
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing comments."""

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        """Return comments the user can see."""
        return (
            Comment.objects.filter(is_active=True)
            .select_related("author", "post")
            .prefetch_related("likes")
        )

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ["create", "update", "partial_update"]:
            return CommentCreateUpdateSerializer
        return CommentSerializer

    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]
        elif self.action == "create":
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]

        return [permission() for permission in permission_classes]

    @action(
        detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated]
    )
    def like(self, request, pk=None):
        """Like or unlike a comment."""
        comment = self.get_object()
        user = request.user

        like, created = CommentLike.objects.get_or_create(user=user, comment=comment)

        if not created:
            like.delete()
            return Response(
                {"detail": "Comment unliked.", "liked": False},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"detail": "Comment liked.", "liked": True}, status=status.HTTP_200_OK
        )


class FollowViewSet(viewsets.ModelViewSet):
    """ViewSet for managing follow relationships."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FollowSerializer

    def get_queryset(self):
        """Return follow relationships for the current user."""
        return Follow.objects.filter(follower=self.request.user).select_related(
            "follower", "followed"
        )

    def create(self, request, *args, **kwargs):
        """Create a follow relationship."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            follow = serializer.save()
            return Response(
                FollowSerializer(follow, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            if "UNIQUE constraint failed" in str(e) or "duplicate key" in str(e):
                return Response(
                    {"detail": "You are already following this user."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            raise

    @action(detail=False, methods=["get"])
    def followers(self, request):
        """Get users following the current user."""
        followers = Follow.objects.filter(followed=request.user).select_related(
            "follower", "followed"
        )
        serializer = FollowSerializer(
            followers, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def unfollow(self, request):
        """Unfollow a user by username."""
        username = request.data.get("username")
        if not username:
            return Response(
                {"detail": "Username is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from apps.accounts.models import User

            user_to_unfollow = User.objects.get(username=username)
            follow = Follow.objects.get(
                follower=request.user, followed=user_to_unfollow
            )
            follow.delete()

            return Response(
                {"detail": f"Successfully unfollowed {username}."},
                status=status.HTTP_200_OK,
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
        except Follow.DoesNotExist:
            return Response(
                {"detail": "You are not following this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for managing reviews."""

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["clique", "rating"]
    ordering_fields = ["created_at", "rating"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Return reviews the user can see."""
        return Review.objects.filter(is_active=True).select_related("author", "clique")

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action in ["create", "update", "partial_update"]:
            return ReviewCreateUpdateSerializer
        return ReviewSerializer

    def get_permissions(self):
        """Return appropriate permissions based on action."""
        if self.action in ["update", "partial_update", "destroy"]:
            permission_classes = [permissions.IsAuthenticated, IsAuthorOrReadOnly]
        elif self.action == "create":
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]

        return [permission() for permission in permission_classes]


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def feed_view(request):
    """Get personalized feed for the current user."""
    user = request.user

    # Get posts from followed users and joined cliques
    posts = (
        Post.objects.filter(
            Q(author__in=user.following.values("followed"))
            | Q(clique__in=user.cliques.all()),
            is_published=True,
        )
        .select_related("author", "clique")
        .prefetch_related("likes")
        .annotate(like_count=Count("likes"), comment_count=Count("comments"))
        .distinct()
        .order_by("-is_pinned", "-created_at")
    )

    # Paginate
    from rest_framework.pagination import PageNumberPagination

    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(posts, request)

    if page is not None:
        serializer = PostListSerializer(page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

    serializer = PostListSerializer(posts, many=True, context={"request": request})
    return Response(serializer.data)
