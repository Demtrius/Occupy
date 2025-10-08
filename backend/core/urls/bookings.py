"""
URL Configuration for Booking-related endpoints.

This module defines URL patterns for bookings.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.booking import (
    BookingListCreateApi,
    BookingRetrieveUpdateDestroyApi,
    BookingConfirmApi,
    BookingCancelApi,
    BookingCompleteApi,
)

app_name = "bookings"

# Create router for any future router-based views
router = DefaultRouter()

urlpatterns = [
    # Include router URLs (for future expansion)
    path("", include(router.urls)),

    # Booking endpoints
    path("", BookingListCreateApi.as_view(), name="booking-list-create"),
    path("<int:id>/", BookingRetrieveUpdateDestroyApi.as_view(), name="booking-detail"),
    path("<int:id>/confirm/", BookingConfirmApi.as_view(), name="booking-confirm"),
    path("<int:id>/cancel/", BookingCancelApi.as_view(), name="booking-cancel"),
    path("<int:id>/complete/", BookingCompleteApi.as_view(), name="booking-complete"),
]