from typing import final
from django.db import models
from requests import Response
from rest_framework import fields, serializers
from Occupy.models import Clique,Post
from Occupier.models import Occupier
from rest_framework.validators import UniqueValidator,ValidationError
from rest_framework_jwt.settings import api_settings
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=65, min_length=8, write_only=True)

    class Meta: 
        model = Occupier
        fields = ('username','email','occupations','password')
    def create(self,validated_data):
        return Occupier.objects.create_user(**validated_data)

# class RegisterSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(max_length=65,min_length=8,write_only=True)

#     class Meta:
#         model = Occupier
#         fields = ('username','email','occupations','password')

#     def validate(self, attrs):
#         email_exists = Occupier.objects.filter(email=attrs['email']).exists
#         if email_exists:
#             raise ValidationError('Email already exists')
#         return super().validate(attrs)




class LoginSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=128, min_length=6, write_only=True)

    class Meta:
        model = Occupier
        fields = ('email','password','token')
        read_only_fields = ['token']


        

class CurrentOccupierSerializer(serializers.ModelSerializer):
    posts = serializers.StringRelatedField(many=True)
    class Meta:
        model = Occupier
        fields =['id','username','email','occupations','date_joined','posts']

class OccupierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Occupier
        fields = ['username','occupations','date_joined']

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls,occupier):
        token = super().get_token(occupier)
        token ['username'] = occupier.username
        token['email'] = occupier.email
        token['occupations'] = occupier.occupations
        return token


class EachOccupierSerializer(serializers.ModelSerializer):
    pass