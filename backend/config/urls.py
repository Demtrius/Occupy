"""
URL Configuration for Occupy Backend

The `urlpatterns` list routes URLs to views.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# API version
API_VERSION = "v1"


def home_view(request):
    """Simple home view with API information."""
    return HttpResponse(
        "<h1>🚀 Occupy Backend API</h1>"
        f"<p>API Version: {API_VERSION}</p>"
        "<p>Visit <a href='/admin/'>Admin Panel</a> or <a href='/api/v1/'>API Endpoints</a></p>"
    )


urlpatterns = [
    path("", lambda request: HttpResponse("Occupy Backend is Live 🚀")),
    path("admin/", admin.site.urls),
    # DRF login/logout views
    path("api-auth/", include("rest_framework.urls")),
    # Your main API endpoints
    path("api/", include(("Occupy.urls", "Occupy"), namespace="home")),
    # Authentication routes
    path(
        "api/auth/",
        include(("authentication.urls", "authentication"), namespace="authentication"),
    ),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
