"""
Main URL Configuration for the Occupy project.
"""

from django.contrib import admin
from django.urls import path, include

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from drf_yasg.generators import OpenAPISchemaGenerator


schema_view = get_schema_view(
    openapi.Info(
        title="Occupy API",
        default_version="v1",
        description="API documentation for the Occupy project",
        terms_of_service="https://www.yourapp.com/policies/terms/",
        contact=openapi.Contact(email="contact@yourapp.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[],
    generator_class=OpenAPISchemaGenerator,
)


@api_view(["GET"])
def health_check(request):
    """
    Health check endpoint that verifies database connectivity.
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return Response(
            {"status": "ok", "database": "connected"}, status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {"status": "error", "database": str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
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
    path(
        "api/v1/availability/",
        include("core.urls.availability", namespace="availability"),
    ),
    # Users
    path("api/v1/users/", include("users.urls", namespace="users")),
    # Authentication
    path("api/v1/auth/", include("authentication.urls", namespace="auth")),
    # Health check
    path("api/health/", health_check, name="health_check"),
    # API Documentation
    path(
        "api/docs/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path(
        "api/redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"
    ),
]
