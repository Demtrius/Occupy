"""
URL Configuration for authentication app.

This module defines URL patterns for user authentication and authorization.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import (
    RegisterView,
    OccupierLoginView,
    CurrentUserView,
    MyTokenObtainPairView,
    LogoutView,
)

app_name = "auth"

urlpatterns = [
    # User registration and management
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", OccupierLoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", CurrentUserView.as_view(), name="me"),

    # JWT Token management
    path("jwt/create/", MyTokenObtainPairView.as_view(), name="jwt_create"),
    path("jwt/refresh/", TokenRefreshView.as_view(), name="jwt_refresh"),
    path("jwt/verify/", TokenVerifyView.as_view(), name="jwt_verify"),
]
