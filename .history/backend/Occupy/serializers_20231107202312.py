from dataclasses import field
from typing import final
from django.db import models
from rest_framework import fields, serializers
from .models import Clique,Post,CommentPost
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
        fields = '__all__'

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
    class Meta:
        model = Clique
        # posts = PostSerializer(many=True)
        # fields = ('name', 'created_at', 'level','id','occupation')
        # name = serializers.StringRelatedField(read_only=False)
        fields = '__all__'


class CliqueSerializer_detailed(serializers.ModelSerializer):
    class Meta:
        model = Clique
        posts = PostSerializer(many=True)
        fields = '__all__'
        depth = 1





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