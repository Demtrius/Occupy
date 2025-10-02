from dataclasses import field
from typing import final
from django.db import models
from rest_framework import fields, serializers
from .models import Clique,Post,CommentPost,Follow,Review,Service, Availability, Booking
from Occupier.models import Occupier
from rest_framework.validators import UniqueTogetherValidator
# from serializers import 

# from drf_writable_nested import WritableNestedModelSerializer

class PostSerializer(serializers.ModelSerializer):
    clique = serializers.ReadOnlyField(source='clique.name')  # Read-only for the name
    clique = serializers.SlugRelatedField(
        queryset=Clique.objects.all(), slug_field='name'
    )  # Use t  # For write operations

    clique_id = serializers.ReadOnlyField(source='clique.id')
    user_id = serializers.ReadOnlyField(source='occupier.id')

 
    occupier = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = ['id','content', 'caption', 'posted', 'occupier', 'user_id', 'timestamp', 'comments','clique','clique_id']

    def get_comments(self,obj):
        comments = CommentPost.objects.filter(post=obj)[:3]
        request = self.context.get('request')

        return {
            "comments" : CommentPostSerializer(comments,many=True).data,
        }
    
    def get_occupier(self, obj):
        return obj.occupier.username if obj.occupier_id else None
    
 
    
    def create(self, validated_data):
        # Automatically associate the authenticated user as the occupier
        validated_data['occupier'] = self.context['request'].user
        return super().create(validated_data)




class PostSerializer_detailed(serializers.ModelSerializer):
    model = Post
    fields = '__all__'
    depth = 1



# class ReviewSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Review
#         fields =  ['occupier','body','clique']
        

class CliqueSerializer(serializers.ModelSerializer):
    reviews = serializers.SerializerMethodField()

    class Meta:
        model = Clique
        fields = ("id", "name", "description", "created_at", "occupation", "level", "reviews")

    def get_reviews(self, obj):
        reviews = obj.reviews.all()
        return ReviewSerializer(reviews, many=True).data




class CliqueSerializer_detailed(serializers.ModelSerializer):
    class Meta:
        model = Clique
        posts = PostSerializer(many=True)
        fields = '__all__'
        depth = 1

class JoinCliqueSerializer(serializers.Serializer):
    clique_id = serializers.IntegerField()

    def validate_community_id(self,value):
        try:
            clique = Clique.objects.get(id=value)
        except Clique.DoesnotExist:
            raise serializers.ValidationError("This clique does not exist.")
        return value
    
    def save(self, **kwargs):
        occupier = Occupier.objects.get(id=self.context['request'].user.id)
        clique = Clique.objects.get(id=self.validated_data['clique_id'])
        clique.members.add(occupier)
        return clique



class CurrentCliqueSerializer(serializers.ModelSerializer):
    posts = PostSerializer(many=True)
    class Meta:
        model = Clique
        fields = ['name','description','level','occupation','posts','created_at']


class CommentPostSerializer(serializers.ModelSerializer):
    post = serializers.StringRelatedField(read_only=True)
    occupier = serializers.ReadOnlyField(source='occupier.username')

    class Meta:
        model = CommentPost
        fields = ['body']


class FollowSerializer(serializers.ModelSerializer):
    follower = serializers.ReadOnlyField(source='follower.username')
    followed = serializers.SlugRelatedField(slug_field='username', queryset=Occupier.objects.all())

    class Meta:
        model = Follow
        fields = ['follower', 'followed', 'created_at']

    def validate_followed(self, value):
        # Prevent users from following themselves
        if self.context['request'].user == value:
            raise serializers.ValidationError("You cannot follow yourself.")
        return value

        if Follow.objects.filter(follower=follower, followed=followed).exists():
            raise serializers.ValidationError("You are already following this user.")
        
        return data



class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['user', 'body', 'clique', 'created_at']


class ServiceSerializer(serializers.ModelSerializer):
    provider_username = serializers.ReadOnlyField(source="provider.username")

    class Meta:
        model = Service
        fields = ["id", "provider", "provider_username", "title", "description", "price", "duration_minutes"]


class AvailabilitySerializer(serializers.ModelSerializer):
    provider_username = serializers.ReadOnlyField(source="provider.username")

    class Meta:
        model = Availability
        fields = ["id", "provider", "provider_username", "date", "start_time", "end_time"]

class BookingSerializer(serializers.ModelSerializer):
    client_username = serializers.ReadOnlyField(source="client.username")
    provider_username = serializers.ReadOnlyField(source="service.provider.username")
    service_title = serializers.ReadOnlyField(source="service.title")

    class Meta:
        model = Booking
        fields = [
            "id",
            "service",
            "service_title",
            "client",
            "client_username",
            "provider_username",
            "date",
            "start_time",
            "end_time",
            "status",
            "created_at",
        ]




