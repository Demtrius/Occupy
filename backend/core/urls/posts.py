"""
URL Configuration for Post-related endpoints.

This module defines URL patterns for posts and comments.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.post import (
    PostListApi,
    PostDetailApi,
    PostCreateApi,
    PostUpdateApi,
    PostDeleteApi,
    PostLikeApi,
    PostFeedApi,
    PostCommentsApi,
    PostAddCommentApi,
)

app_name = "posts"

# Create router for any future router-based views
router = DefaultRouter()

urlpatterns = [
    # Include router URLs (for future expansion)
    path("", include(router.urls)),

    # Post endpoints
    path("", PostListApi.as_view(), name="post-list"),
    path("<int:id>/", PostDetailApi.as_view(), name="post-detail"),
    path("create/", PostCreateApi.as_view(), name="post-create"),
    path("feed/", PostFeedApi.as_view(), name="post-feed"),
    path("<int:id>/update/", PostUpdateApi.as_view(), name="post-update"),
    path("<int:id>/delete/", PostDeleteApi.as_view(), name="post-delete"),
    path("<int:id>/like/", PostLikeApi.as_view(), name="post-like"),
    path("<int:id>/comments/", PostCommentsApi.as_view(), name="post-comments"),
    path("<int:id>/comments/add/", PostAddCommentApi.as_view(), name="post-add-comment"),
]