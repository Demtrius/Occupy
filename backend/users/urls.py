"""
URL Configuration for users app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet

app_name = "users"

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    # Include all router URLs
    path("", include(router.urls)),
]
