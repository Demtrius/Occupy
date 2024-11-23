from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views import *
from .views import RegisterView,OccupierLoginView,OccupierListView,MyTokenObtainPairView
from rest_framework_jwt.views import refresh_jwt_token, verify_jwt_token
from rest_framework_simplejwt.views import (TokenObtainPairView,TokenRefreshView, TokenVerifyView)
app_name = 'Occupier'

urlpatterns = [
    path('register', RegisterView.as_view()),
    path('login/',OccupierLoginView.as_view()),
    # path("jwt/create/",TokenObtainPairView.as_view(),name='jwt_create')
    path("jwt/create/", TokenObtainPairView.as_view(), name="jwt_create"),
    path("jwt/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("jwt/verify/", TokenVerifyView.as_view(), name="token_verify"),
    path('occupier-list/',OccupierListView.as_view(), name="occupier"),
    # path('follow_unfollow/',FollowUnfollowView.as_view(), name="follow_unfollow"),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
]
