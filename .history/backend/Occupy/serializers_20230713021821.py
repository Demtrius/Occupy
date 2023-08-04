from dataclasses import field
from typing import final
from django.db import models
from rest_framework import fields, serializers
from .models import Clique,Post,CliquePost
from Occupier.models import Occupier
from rest_framework.validators import UniqueTogetherValidator

# from drf_writable_nested import WritableNestedModelSerializer



class PostSerializer(serializers.ModelSerializer):
   # clique = serializers.StringRelatedField(many=False)
    #occupier = serializers.StringRelatedField(many=False)

    class Meta:
        model = Post
        fields = ('content', 'caption',  'clique' , 'occupier', 'status','id')



class CliqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clique
        fields = ('name', 'created_at', 'level','id','occupation')


class CurrentOccupierPostsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Occupier
       







