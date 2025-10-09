"""
URL Configuration for Service-related endpoints.

This module defines URL patterns for services.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from ..views.service import ServiceListCreateApi, ServiceRetrieveUpdateDestroyApi

app_name = "services"

# Create router for any future router-based views
router = DefaultRouter()

urlpatterns = [
    # Service endpoints
    path("", ServiceListCreateApi.as_view(), name="service-list-create"),
    path("<int:id>/", ServiceRetrieveUpdateDestroyApi.as_view(), name="service-detail"),
]