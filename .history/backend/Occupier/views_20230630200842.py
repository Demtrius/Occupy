from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import RegisterSerializer,LoginSerializer,CurrentOccupierSerializer
from .models import Occupier
from django.contrib.auth import authenticate
from rest_framework.generics import GenericAPIView
from rest_framework import status,response,serializers,generics
from .utils import generate_access_token
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
import jwt
from rest_framework.decorators import api_view,permission_classes,APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
# Create your views here.


# class RegisterView(APIView):
#     serializer_class = RegisterSerializer

#     def post(self, request):
#         serializer = self.serializer_class(data=request.data)

#         if serializer.is_valid():
#             serializer.save()
#             return response.Response(serializer.data, status=status.HTTP_201_CREATED)
#         return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    serializer_class = RegisterSerializer

    def post(self,request:Request):
        data = request.data

        serializer = self.serializer_class(data=data)

        if serializer.is_valid():
            serializer.save()

        response = {
               "message" : "Occupier created successfully",
               "data" : serializer.data
           }
        return Response(data=response, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
        
            




class OccupierLoginView(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        email = request.data.get('email',None)
        password = request.data.get('password',None)

        occupier = authenticate(username=email, password=password)

        if occupier:
            serializer = self.serializer_class(occupier)

            return response.Response(serializer.data, status=status.HTTP_200_OK)
        return response.Response({'message': 'Invalid credentials try again'}, status=status.HTTP_401_UNAUTHORIZED)


