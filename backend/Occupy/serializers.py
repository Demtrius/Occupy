from dataclasses import field
from typing import final
from django.db import models
from rest_framework import fields, serializers
from .models import Clique,Post,CommentPost,Follow,Review
from Occupier.models import Occupier
from rest_framework.validators import UniqueTogetherValidator
# from serializers import 

# from drf_writable_nested import WritableNestedModelSerializer








class PostSerializer(serializers.ModelSerializer):
    # clique = serializers.StringRelatedField(many=False)
    occupier = serializers.StringRelatedField(many=False)
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
    


class PostSerializer_detailed(serializers.ModelSerializer):
    model = Post
    fields = '__all__'
    depth = 1



class CliqueSerializer(serializers.ModelSerializer):
    posts = PostSerializer(many=True) 
    reviews = serializers.SerializerMethodField()
    
    class Meta:
        model = Clique
        fields = '__all__'

    def get_reviews(self,obj):
        reviews = obj.reviews.all()
        return [f"{review.user}: {review.comment}" for review in reviews]


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
    posts = serializers.StringRelatedField(many=True)
    class Meta:
        model = Clique
        fields = ['name','description','level','occupation','posts']


class CommentPostSerializer(serializers.ModelSerializer):
    post = serializers.StringRelatedField(read_only=True)
    occupier = serializers.ReadOnlyField(source='occupier.username')

    class Meta:
        model = CommentPost
        fields = '__all__'


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
        fields = ['id', 'occupier', 'clique',  'body', 'created_at']

