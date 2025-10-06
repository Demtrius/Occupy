"""
URL Configuration for core app (Posts and Cliques).
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CliqueViewSet

app_name = "core"

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r"posts", PostViewSet, basename="post")
router.register(r"cliques", CliqueViewSet, basename="clique")

urlpatterns = [
    # Include all router URLs
    path("", include(router.urls)),
]
