"""
URL patterns for the accounts app.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    UserRegistrationView,
    UserLoginView,
    CustomTokenObtainPairView,
    UserLogoutView,
    UserProfileView,
    UserDetailView,
    UserListView,
    BlockedUserListView,
    BlockedUserDetailView,
    current_user_view,
    change_password_view,
)

app_name = "accounts"

urlpatterns = [
    # Authentication
    path("register/", UserRegistrationView.as_view(), name="register"),
    path("login/", UserLoginView.as_view(), name="login"),
    path("logout/", UserLogoutView.as_view(), name="logout"),
    # JWT Token management
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    # User management
    path("profile/", UserProfileView.as_view(), name="profile"),
    path("me/", current_user_view, name="current_user"),
    path("change-password/", change_password_view, name="change_password"),
    # User discovery
    path("users/", UserListView.as_view(), name="user_list"),
    path("users/<str:username>/", UserDetailView.as_view(), name="user_detail"),
    # Blocked users
    path("blocked/", BlockedUserListView.as_view(), name="blocked_list"),
    path("blocked/<int:pk>/", BlockedUserDetailView.as_view(), name="blocked_detail"),
]
