from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import RegisterSerializer,LoginSerializer,OccupierSerializer,CurrentOccupierSerializer,MyTokenObtainPairSerializer
from .models import Occupier
from django.contrib.auth import authenticate
from rest_framework.generics import GenericAPIView
from rest_framework import status,response,serializers,generics,viewsets,request
from .utils import generate_access_token,create_jwt_pair_for_user
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
import jwt
from rest_framework.decorators import api_view,permission_classes,APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from django.http import JsonResponse,Http404
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.views import TokenObtainPairView
# Create your views here.


class RegisterView(APIView):
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            serializer.save()
            return response.Response(serializer.data, status=status.HTTP_201_CREATED)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# class RegisterView(APIView):
#     serializer_class = RegisterSerializer

#     def post(self,request:Request): 
#         data = request.data

#         serializer = self.serializer_class(data=data)

#         if serializer.is_valid():
#             serializer.save()

#         response = {
#                "message" : "Occupier created successfully",
#                "data" : serializer.data
#            }
#         return Response(data=response, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
        
            




class OccupierLoginView(APIView):
    serializer_class = LoginSerializer

    def post(self, request):
        email = request.data.get('email',None)
        password = request.data.get('password',None)

        occupier = authenticate(username=email, password=password)

        if occupier:
            serializer = self.serializer_class(occupier)

            tokens = create_jwt_pair_for_user(occupier)
            # response = {"message": "Login Successfull", "tokens": tokens}
            return response.Response(serializer.data, status=status.HTTP_200_OK)
        
        return response.Response({'message': 'Invalid credentials try again'}, status=status.HTTP_401_UNAUTHORIZED)


# class OccupierLoginView(APIView):
#     permission_classes = []
#     def post(self, request:Request):
#         email = request.data.get('email')
#         password = request.data.get('password')

#         occupier = authenticate(username=email, password=password)
        
#         if occupier is not None:
#             response = {
#                 "message"  : 'Login successful',
#                 "token": occupier.auth_token.key
#             }
#             return Response(data=response , status=status.HTTP_200_OK)
#         else:
#             return Response(data={"message": "Invalid email or password"})
        
# class OccupierLoginView(APIView):
#     serializer_class = LoginSerializer

#     def post(self, request):
#         email = request.data.get('email',None)
#         password = request.data.get('password',None)

#         occupier = authenticate(username=email, password=password)

#         if occupier:
#             serializer = self.serializer_class(occupier)

#             return response.Response(serializer.data, status=status.HTTP_200_OK)
#         return response.Response({'message': 'Invalid credentials try again'}, status=status.HTTP_401_UNAUTHORIZED)

 
class OccupierListView(generics.ListCreateAPIView):
    queryset = Occupier.objects.all()
    serializer_class = OccupierSerializer

    def list(self, request):
        queryset = self.get_queryset()
        serializer = OccupierSerializer(queryset,many=True)
        return Response(serializer.data)
    
@api_view(http_method_names=['GET'])
@permission_classes([IsAuthenticated])
def get_occupier_by_token(token):
    occupier_id = Token.objects.get(key=request.auth.key).user_id
    occupier = Occupier.object.get(id=occupier_id)
    return JsonResponse({"user": occupier.id})


    
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class FollowUnfollowView(APIView):
    permission_classes = [IsAuthenticated]

    def current_occupier(self):
        try:
            return Occupier.objects.get(occupier = self.request.occupier)
        except Occupier.DoesNotExist:
            raise Http404
        
    def other_occupier(self,pk):
        try:
            return Occupier.objects.get(id=pk)
        except Occupier.DoesNotExist:
            raise Http404
        
    def post(self,request , format=None):
        pk = request.data.get('id')
        req_type = request.data.get('type')  

        current_occupier = self.get_current_occupier()
        other_occupier = self.other_occupier()

        if req_type == 'follow':
            if other_occupier.private_account:
                other_occupier.pending_request.add(current_occupier)
                return Response({"Requested": "Follow request has been sent "},status=status.HTTP_200_OK)
