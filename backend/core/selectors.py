"""
Selectors for core app data fetching.
"""

from typing import List, Optional, Iterable
from django.db.models import Q, Count, Exists, OuterRef
from django.contrib.auth import get_user_model

from .models import Post, CommentPost, Like, Clique, Service, Booking

User = get_user_model()


# Post selectors
def post_list(*, filters=None, user=None) -> Iterable[Post]:
    """Get a list of posts with optional filtering."""
    filters = filters or {}
    queryset = Post.objects.select_related("occupier", "clique").prefetch_related(
        "comments", "likes"
    )

    # Annotate is_liked for authenticated users
    if user and user.is_authenticated:
        queryset = queryset.annotate(
            is_liked=Exists(Like.objects.filter(post=OuterRef('pk'), user=user))
        )

    # Filter by status - only show posted posts to unauthenticated users
    if not user or not user.is_authenticated:
        queryset = queryset.filter(status="posted")

    # Apply filters
    if "clique" in filters:
        queryset = queryset.filter(clique=filters["clique"])
    if "occupier" in filters:
        queryset = queryset.filter(occupier=filters["occupier"])
    if "status" in filters:
        queryset = queryset.filter(status=filters["status"])

    return queryset.order_by("-created")


def post_get(*, id: int, user=None) -> Optional[Post]:
    """Get a single post by ID."""
    try:
        queryset = Post.objects.select_related("occupier", "clique").prefetch_related(
            "comments", "likes"
        )

        # Annotate is_liked for authenticated users
        if user and user.is_authenticated:
            queryset = queryset.annotate(
                is_liked=Exists(Like.objects.filter(post=OuterRef('pk'), user=user))
            )

        post = queryset.get(id=id)

        # Check permissions
        if post.status != "posted" and (not user or not user.is_authenticated):
            return None

        return post
    except Post.DoesNotExist:
        return None


def post_feed_get(*, user) -> Iterable[Post]:
    """Get personalized feed of posts from cliques the user is member of."""
    # Get cliques user is a member of or owns
    user_cliques = Clique.objects.filter(
        Q(members=user) | Q(occupier=user)
    ).distinct()

    # Get posts from those cliques
    posts = Post.objects.filter(
        clique__in=user_cliques, status="posted"
    ).select_related("occupier", "clique").prefetch_related(
        "comments", "likes"
    ).annotate(
        is_liked=Exists(Like.objects.filter(post=OuterRef('pk'), user=user))
    ).order_by("-created")

    return posts


# Comment selectors
def comment_list(*, post: Post) -> Iterable[CommentPost]:
    """Get all comments for a post."""
    return CommentPost.objects.filter(post=post).select_related("occupier").order_by("-created")


def comment_get(*, id: int) -> Optional[CommentPost]:
    """Get a single comment by ID."""
    try:
        return CommentPost.objects.select_related("occupier", "post").get(id=id)
    except CommentPost.DoesNotExist:
        return None


# Like selectors
def like_list(*, post: Optional[Post] = None, user = None) -> Iterable[Like]:
    """Get likes, optionally filtered by post or user."""
    queryset = Like.objects.select_related("user", "post")

    if post:
        queryset = queryset.filter(post=post)
    if user:
        queryset = queryset.filter(user=user)

    return queryset.order_by("-created")


def like_exists(*, post: Post, user) -> bool:
    """Check if a user has liked a post."""
    return Like.objects.filter(post=post, user=user).exists()


# Clique selectors
def clique_list(*, filters=None, user=None) -> Iterable[Clique]:
    """Get a list of cliques with optional filtering."""
    filters = filters or {}
    queryset = Clique.objects.select_related("occupier").prefetch_related("members")

    # Annotate is_member for authenticated users
    if user and user.is_authenticated:
        queryset = queryset.annotate(
            is_member=Exists(Clique.members.through.objects.filter(
                clique=OuterRef('pk'), occupier=user
            ))
        )

    # Apply filters
    if "occupier" in filters:
        queryset = queryset.filter(occupier=filters["occupier"])
    if "name" in filters:
        queryset = queryset.filter(name__icontains=filters["name"])

    return queryset.order_by("-created")


def clique_get(*, id: int) -> Optional[Clique]:
    """Get a single clique by ID."""
    try:
        return Clique.objects.select_related("occupier").prefetch_related("members").get(id=id)
    except Clique.DoesNotExist:
        return None


def clique_user_is_member(*, clique: Clique, user) -> bool:
    """Check if a user is a member of a clique."""
    return clique.members.filter(id=user.id).exists()


# Service selectors
def service_list(*, filters=None) -> Iterable[Service]:
    """Get a list of services with optional filtering."""
    filters = filters or {}
    queryset = Service.objects.select_related("clique", "provider")

    if "clique" in filters:
        queryset = queryset.filter(clique=filters["clique"])
    if "provider" in filters:
        queryset = queryset.filter(provider=filters["provider"])
    if "is_active" in filters:
        queryset = queryset.filter(is_active=filters["is_active"])

    return queryset.order_by("-created")


def service_get(*, id: int, user=None) -> Optional[Service]:
    """Get a single service by ID."""
    try:
        service = Service.objects.select_related("clique", "provider").get(id=id)
        return service
    except Service.DoesNotExist:
        return None


# Booking selectors
def booking_list(*, user, filters=None) -> Iterable[Booking]:
    """Get a list of bookings for a user with optional filtering."""
    filters = filters or {}
    queryset = Booking.objects.select_related("service", "client", "provider", "clique")

    # Filter by client or provider
    queryset = queryset.filter(Q(client=user) | Q(provider=user))

    if "status" in filters:
        queryset = queryset.filter(status=filters["status"])
    if "date" in filters:
        queryset = queryset.filter(date=filters["date"])

    return queryset.order_by("-created")


def booking_get(*, id: int, user) -> Optional[Booking]:
    """Get a single booking by ID, ensuring it belongs to the user."""
    try:
        booking = Booking.objects.select_related("service", "client", "provider", "clique").get(id=id)
        if booking.client != user and booking.provider != user:
            return None
        return booking
    except Booking.DoesNotExist:
        return None