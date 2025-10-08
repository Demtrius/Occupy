"""
URL Configuration for Review-related endpoints.

This module defines URL patterns for reviews.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.review import ReviewViewSet

app_name = "reviews"

# Create router for review CRUD operations
router = DefaultRouter()
router.register(r"", ReviewViewSet, basename="review")

urlpatterns = [
    # Include router URLs for standard CRUD operations
    path("", include(router.urls)),
]