from typing import final
from django.db import models
from requests import Response
from rest_framework import fields, serializers
from Occupy.models import Clique,Post,CommentPost,Follow,Review,Review
from Occupier.models import Occupier
from Occupy.serializers import FollowSerializer,CliqueSerializer,PostSerializer
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





class LoginSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=128, min_length=6, write_only=True)

    class Meta:
        model = Occupier
        fields = ('email','password','token')
        read_only_fields = ['token']




        

class CurrentOccupierSerializer(serializers.ModelSerializer):
#     posts = serializers.StringRelatedField(many=True)
#     cliques = serializers.StringRelatedField(many=True)

    posts = PostSerializer(many=True)

    class Meta:
        model = Occupier
        fields =['id','username','email','occupations','date_joined','posts','followers','cliques']

class OccupierSerializer(serializers.ModelSerializer):
    following = serializers.SerializerMethodField()
    followers = serializers.SerializerMethodField()

    class Meta:
        model = Occupier
        fields = ['username', 'id', 'occupations','date_joined','following','followers']
    
    def get_following(self,obj):
        return FollowSerializer(obj.following.all(), many=True).data
    def get_followers(self, obj):
        return FollowSerializer(obj.followers.all(), many=True).data

        

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls,occupier):
        token = super().get_token(occupier)
        token ['username'] = occupier.username
        token['email'] = occupier.email
        token['occupations'] = occupier.occupations
        return token


class EachOccupierSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source = 'occupier.username')
    class Meta:
        model = Occupier
        fields = ('id','username')



