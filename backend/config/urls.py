"""
Main URL Configuration for the Occupy project.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1 (current version)
    # Posts and Comments
    path("api/v1/posts/", include("core.urls.posts", namespace="posts")),
    path("api/v1/comments/", include("core.urls.comments", namespace="comments")),
    # Cliques
    path("api/v1/cliques/", include("core.urls.cliques", namespace="cliques")),
    # Services and Bookings
    path("api/v1/services/", include("core.urls.services", namespace="services")),
    path("api/v1/bookings/", include("core.urls.bookings", namespace="bookings")),
    # Reviews and Availability
    path("api/v1/reviews/", include("core.urls.reviews", namespace="reviews")),
    path("api/v1/availability/", include("core.urls.availability", namespace="availability")),
    # Users
    path("api/v1/users/", include("users.urls", namespace="users")),
    # Authentication
    path("api/v1/auth/", include("authentication.urls", namespace="auth")),
    # API Schema and Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]
