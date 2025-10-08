"""
URL Configuration for Availability-related endpoints.

This module defines URL patterns for availability slots.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.availability import AvailabilityViewSet

app_name = "availability"

# Create router for availability CRUD operations
router = DefaultRouter()
router.register(r"", AvailabilityViewSet, basename="availability")

urlpatterns = [
    # Include router URLs for standard CRUD operations
    path("", include(router.urls)),
]