from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    MyTokenObtainPairSerializer,
    CurrentOccupierSerializer,
)
from Occupier.models import Occupier
from django.contrib.auth import authenticate
from rest_framework import status, response
from .utils import create_jwt_pair_for_user
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


@method_decorator(csrf_exempt, name="dispatch")
class RegisterView(APIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return response.Response(serializer.data, status=status.HTTP_201_CREATED)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class OccupierLoginView(APIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", None)
        password = request.data.get("password", None)

        occupier = authenticate(username=email, password=password)

        if occupier:
            tokens = create_jwt_pair_for_user(occupier)
            return response.Response(tokens, status=status.HTTP_200_OK)

        return response.Response(
            {"message": "Invalid credentials try again"},
            status=status.HTTP_401_UNAUTHORIZED,
        )


@method_decorator(csrf_exempt, name="dispatch")
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CurrentOccupierSerializer

    def get(self, request):
        serializer = self.serializer_class(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    permission_classes = [AllowAny]


@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)
