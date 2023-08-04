from typing import final
from django.db import models
from requests import Response
from rest_framework import fields, serializers
from Occupy.models import Clique,Post
from Occupier.models import Occupier
from rest_framework.validators import UniqueValidator
from rest_framework_jwt.settings import api_settings
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authtoken.models import Token

# class RegisterSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(max_length=65, min_length=8, write_only=True)

#     class Meta: 
#         model = Occupier
#         fields = ('username','email','occupations','password')
#     def create(self,validated_data):
#         return Occupier.objects.create_user(**validated_data)

class RegisterSerializer(serializers.ModelSerializer):
      pass

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
        fields =['id','username','email','posts']