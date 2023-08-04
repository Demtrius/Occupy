from dataclasses import field
from typing import final
from django.db import models
from rest_framework import fields, serializers
from .models import Clique,Post,CliquePost,Tag,TagType
from Occupier.models import Occupier
from rest_framework.validators import UniqueTogetherValidator
from serializers import ModelReadOnlySerializer
# from drf_writable_nested import WritableNestedModelSerializer



class PostSerializer(serializers.ModelSerializer):
   # clique = serializers.StringRelatedField(many=False)
    #occupier = serializers.StringRelatedField(many=False)

    class Meta:
        model = Post
        fields = ('content', 'caption',  'clique' , 'status','id','occupier')



class CliqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clique
        fields = ('name', 'created_at', 'level','id','occupation')



class TagTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TagType
        fields = ('id', 'title',)
        read_only_fields = ('id',)


class TagSerializer(serializers.ModelSerializer):
    tag_type = TagTypeSerializer()

    class Meta:
        model = Tag
        fields = ('id', 'name', 'tag_type')
        read_only_fields = ('id',)


class TagReadOnlySerializer(ModelReadOnlySerializer):
    class Meta:
        model = Tag
        fields = '__all__'


       
class CliqueReadOnlySerializer(ModelReadOnlySerializer):
    topics = TagSerializer(required=False, many=True)
    level_type = serializers.SerializerMethodField()

    class Meta:
        model = Clique
        fields = ('name', 'created_at', 'level','id','occupation','description','topics')

    def get_clique_level(self,obj):
        pass






