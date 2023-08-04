from django.urls import path
from .views import RegisterView,OccupierLoginView
from rest_framework_jwt.views import refresh_jwt_token, verify_jwt_token
from rest_framework_jwt_simplejwt.views import (TokenObtainPairView)
app_name = 'Occupier'

urlpatterns = [
    path('register', RegisterView.as_view()),
    path('login/',OccupierLoginView.as_view()),
    path("jwt/create/",TokenObtainPairView.as_view(),name='jwt_create')
]
