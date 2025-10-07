"""
URL Configuration for core app (Posts and Cliques).
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # Post
    PostListApi,
    PostDetailApi,
    PostCreateApi,
    PostUpdateApi,
    PostDeleteApi,
    PostLikeApi,
    PostFeedApi,
    # Comment
    PostCommentsApi,
    PostAddCommentApi,
    CommentUpdateApi,
    CommentDeleteApi,
)
from .views.clique import CliqueViewSet
from .views.service import ServiceListCreateApi, ServiceRetrieveUpdateDestroyApi
from .views.availability import AvailabilityViewSet
from .views.booking import (
    BookingListCreateApi,
    BookingRetrieveUpdateDestroyApi,
    BookingConfirmApi,
    BookingCancelApi,
    BookingCompleteApi,
)
from .views.review import ReviewViewSet

app_name = "core"

router = DefaultRouter()
router.register(r"cliques", CliqueViewSet, basename="clique")
router.register(r"availability", AvailabilityViewSet, basename="availability")
router.register(r"reviews", ReviewViewSet, basename="review")

urlpatterns = [
    path("", include(router.urls)),
    path("cliques/me/", CliqueViewSet.as_view({"get": "my_cliques"}), name="clique-me"),
    path("cliques/<int:pk>/join/", CliqueViewSet.as_view({"post": "join"}), name="clique-join"),
    path("cliques/<int:pk>/leave/", CliqueViewSet.as_view({"post": "leave"}), name="clique-leave"),
    path("cliques/<int:pk>/members/", CliqueViewSet.as_view({"get": "members"}), name="clique-members"),
    path("cliques/<int:pk>/posts/", CliqueViewSet.as_view({"get": "posts"}), name="clique-posts"),
    # Post endpoints
    path("posts/", PostListApi.as_view(), name="post-list"),
    path("posts/create/", PostCreateApi.as_view(), name="post-create"),
    path("posts/feed/", PostFeedApi.as_view(), name="post-feed"),
    path("posts/<int:id>/", PostDetailApi.as_view(), name="post-detail"),
    path("posts/<int:id>/update/", PostUpdateApi.as_view(), name="post-update"),
    path("posts/<int:id>/delete/", PostDeleteApi.as_view(), name="post-delete"),
    path("posts/<int:id>/like/", PostLikeApi.as_view(), name="post-like"),
    path(
        "posts/<int:id>/comments/", PostCommentsApi.as_view(), name="post-comments"
    ),
    path(
        "posts/<int:id>/add-comment/",
        PostAddCommentApi.as_view(),
        name="post-add-comment",
    ),
    # Comment endpoints
    path(
        "comments/<int:id>/update/",
        CommentUpdateApi.as_view(),
        name="comment-update",
    ),
    path(
        "comments/<int:id>/delete/",
        CommentDeleteApi.as_view(),
        name="comment-delete",
    ),
    # Service endpoints
    path("services/", ServiceListCreateApi.as_view(), name="service-list-create"),
    path(
        "services/<int:id>/",
        ServiceRetrieveUpdateDestroyApi.as_view(),
        name="service-detail",
    ),
    # Booking endpoints
    path("bookings/", BookingListCreateApi.as_view(), name="booking-list-create"),
    path(
        "bookings/<int:id>/",
        BookingRetrieveUpdateDestroyApi.as_view(),
        name="booking-detail",
    ),
    path(
        "bookings/<int:id>/confirm/",
        BookingConfirmApi.as_view(),
        name="booking-confirm",
    ),
    path(
        "bookings/<int:id>/cancel/",
        BookingCancelApi.as_view(),
        name="booking-cancel",
    ),
    path(
        "bookings/<int:id>/complete/",
        BookingCompleteApi.as_view(),
        name="booking-complete",
    ),
]
