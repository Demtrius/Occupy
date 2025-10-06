"""
URL Configuration for core app (Posts and Cliques).
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostViewSet,
    CliqueViewSet,
    LikeViewSet,
    CommentViewSet,
    ReviewViewSet,
    ServiceViewSet,
    AvailabilityViewSet,
    BookingViewSet,
)

app_name = "core"

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r"posts", PostViewSet, basename="post")
router.register(r"cliques", CliqueViewSet, basename="clique")
router.register(r"likes", LikeViewSet, basename="like")
router.register(r"comments", CommentViewSet, basename="comment")
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"availability", AvailabilityViewSet, basename="availability")
router.register(r"bookings", BookingViewSet, basename="booking")

urlpatterns = [
    # Include all router URLs
    path("", include(router.urls)),
]
