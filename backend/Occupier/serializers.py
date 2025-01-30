from typing import final
from django.db import models
from requests import Response
from rest_framework import fields, serializers
from Occupy.models import Clique,Post,CommentPost,Follow,Review,Review
from Occupier.models import Occupier
from Occupy.serializers import FollowSerializer
from rest_framework.validators import UniqueValidator,ValidationError
from rest_framework_jwt.settings import api_settings
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer



class PostSerializer(serializers.ModelSerializer):
    clique = serializers.ReadOnlyField(source='clique.name')  # Read-only for the name
    clique = serializers.SlugRelatedField(
        queryset=Clique.objects.all(), slug_field='name'
    )  # Use t  # For write operations
    occupier = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id','content', 'caption', 'posted', 'occupier', 'timestamp', 'comments','clique']

    def get_comments(self,obj):
        comments = CommentPost.objects.filter(post=obj)[:3]
        request = self.context.get('request')

        return {
            "comments" : CommentPostSerializer(comments,many=True).data,
        }
    
    def get_occupier(self, obj):
        return obj.occupier.username if obj.occupier else None
    
 
    
    def create(self, validated_data):
        # Automatically associate the authenticated user as the occupier
        validated_data['occupier'] = self.context['request'].user
        return super().create(validated_data)



class CommentPostSerializer(serializers.ModelSerializer):
    post = serializers.StringRelatedField(read_only=True)
    occupier = serializers.ReadOnlyField(source='occupier.username')

    class Meta:
        model = CommentPost
        fields = '__all__'




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
    # posts = serializers.StringRelatedField(many=True)
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



