from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from .views import (
    RegisterView,
    OccupierLoginView,
    OccupierListView,
    CurrentUserView,
    MyTokenObtainPairView,
    LogoutView,
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)

app_name = "Occupier"

urlpatterns = [
    path("register", RegisterView.as_view()),
    path("register/", RegisterView.as_view()),  # With trailing slash
    path("users/", RegisterView.as_view()),  # Djoser-compatible endpoint
    path("login/", OccupierLoginView.as_view()),
    path(
        "jwt/create/", csrf_exempt(MyTokenObtainPairView.as_view()), name="jwt_create"
    ),
    path("jwt/refresh/", csrf_exempt(TokenRefreshView.as_view()), name="token_refresh"),
    path("jwt/verify/", csrf_exempt(TokenVerifyView.as_view()), name="token_verify"),
    path("occupier-list/", OccupierListView.as_view(), name="occupier"),
    path(
        "users/me/", CurrentUserView.as_view(), name="current_user"
    ),  # Djoser-compatible endpoint
    path("token/", MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("logout/", LogoutView.as_view(), name="auth_logout"),
]
