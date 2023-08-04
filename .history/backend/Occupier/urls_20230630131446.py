from django.urls import path
from .views import RegisterView,OccupierLoginView
from rest_framework_jwt.views import refresh_jwt_token, verify_jwt_token, TokenObtainPairView,TokenRefreshView,TokenVerifyView
app_name = 'Occupier'

urlpatterns = [
    path('register', RegisterView.as_view()),
    path('login/',OccupierLoginView.as_view()),
]
