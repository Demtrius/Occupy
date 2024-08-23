from django.urls import path
from .views import RegisterView,OccupierLoginView,OccupierListView,OccupierProfileView
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
    path('occupier-profile',OccupierProfileView.as_view(),name='occupier_profile'),
    
]
