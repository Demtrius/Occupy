"""
URL Configuration for Clique-related endpoints.

This module defines URL patterns for cliques and their operations.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.clique import CliqueViewSet

app_name = "cliques"

# Create router for clique CRUD operations
router = DefaultRouter()
router.register(r"", CliqueViewSet, basename="clique")

urlpatterns = [
    # Include router URLs for standard CRUD operations
    path("", include(router.urls)),

    # Additional clique-specific actions
    path("<int:pk>/join/", CliqueViewSet.as_view({"post": "join"}), name="clique-join"),
    path("<int:pk>/leave/", CliqueViewSet.as_view({"post": "leave"}), name="clique-leave"),
    path("<int:pk>/members/", CliqueViewSet.as_view({"get": "members"}), name="clique-members"),
    path("<int:pk>/posts/", CliqueViewSet.as_view({"get": "posts"}), name="clique-posts"),
    path("me/", CliqueViewSet.as_view({"get": "my_cliques"}), name="clique-me"),
]