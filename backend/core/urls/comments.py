"""
URL Configuration for Comment-related endpoints.

This module defines URL patterns for comment operations.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.post import CommentUpdateApi, CommentDeleteApi

app_name = "comments"

# Create router for any future router-based views
router = DefaultRouter()

urlpatterns = [
    # Include router URLs (for future expansion)
    path("", include(router.urls)),

    # Comment endpoints
    path("<int:id>/update/", CommentUpdateApi.as_view(), name="comment-update"),
    path("<int:id>/delete/", CommentDeleteApi.as_view(), name="comment-delete"),
]