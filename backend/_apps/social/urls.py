"""
URL patterns for the social app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CliqueViewSet,
    PostViewSet,
    CommentViewSet,
    FollowViewSet,
    ReviewViewSet,
    feed_view,
)

app_name = "social"

# Create router and register viewsets
router = DefaultRouter()
router.register(r"cliques", CliqueViewSet, basename="clique")
router.register(r"posts", PostViewSet, basename="post")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"follows", FollowViewSet, basename="follow")
router.register(r"reviews", ReviewViewSet, basename="review")

urlpatterns = [
    # Feed endpoint
    path("feed/", feed_view, name="feed"),
    # Include router URLs
    path("", include(router.urls)),
]
