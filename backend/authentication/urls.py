from django.urls import path
from .views import (
    RegisterView,
    CurrentUserView,
    MyTokenObtainPairView,
    LogoutView,
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

app_name = "authentication"

urlpatterns = [
    path("users/", RegisterView.as_view(), name="register"),
    path("jwt/create/", MyTokenObtainPairView.as_view(), name="jwt_create"),
    path("jwt/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("jwt/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("users/me/", CurrentUserView.as_view(), name="current_user"),
    path("logout/", LogoutView.as_view(), name="auth_logout"),
]
