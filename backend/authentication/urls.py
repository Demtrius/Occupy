from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import (
    RegisterView,
    OccupierLoginView,
    CurrentUserView,
    MyTokenObtainPairView,
    MyTokenRefreshView,
    LogoutView,
)

app_name = "authentication"

# Create a router and register our viewsets
router = DefaultRouter()

urlpatterns = [
    # Include all router URLs
    path("", include(router.urls)),
    # JWT Token endpoints (matching mobile app expectations)
    path("jwt/create/", MyTokenObtainPairView.as_view(), name="jwt_create"),
    path("jwt/refresh/", MyTokenRefreshView.as_view(), name="jwt_refresh"),
    path("jwt/verify/", TokenVerifyView.as_view(), name="jwt_verify"),
    # User endpoints (matching mobile app expectations)
    path("users/", RegisterView.as_view(), name="register"),
    path("users/me/", CurrentUserView.as_view(), name="current_user"),
    # Legacy endpoints (keeping for backward compatibility)
    path("register/", RegisterView.as_view(), name="register_legacy"),
    path("login/", OccupierLoginView.as_view(), name="login_legacy"),
    path("user/", CurrentUserView.as_view(), name="current_user_legacy"),
    path("token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("logout/", LogoutView.as_view(), name="logout"),

]
