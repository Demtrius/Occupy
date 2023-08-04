from dataclasses import field
from typing import final
from django.db import models
from rest_framework import fields, serializers
from .models import Clique,Post,CliquePost,Tag,TagType,CliqueMember
from Occupier.models import Occupier
from rest_framework.validators import UniqueTogetherValidator
from serializers import ModelReadOnlySerializer

# from drf_writable_nested import WritableNestedModelSerializer



class PostSerializer(serializers.ModelSerializer):
    clique = serializers.StringRelatedField(many=False)
    occupier = Occupier()

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


class TagReadOnlySerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'


       
class CliqueReadOnlySerializer(serializers.ModelSerializer):
    topics = TagSerializer(required=False, many=True)
    level_type = serializers.SerializerMethodField()

    class Meta:
        model = Clique
        fields = ('name', 'created_at', 'level','id','occupation','description','topics')

    def get_clique_level(self,obj):
        if obj.clique_level is not None:
            return obj.clique_level.name()
        return None

class CliqueReadOnlyLightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clique
        fields = ('id','name')

class CliqueCreateSerializer(serializers.ModelSerializer):
    topics = TagSerializer(required=False, many=True)
    class Meta:
        model = Clique
        fields = ('id','name','description','clique_type','topics')
        
        def create(self,validated_data):
            occupier = self.context['occupier']
            clique = Clique.objects.create(**validated_data)
            member = CliqueMember.objects.create(
                clique=clique,
                occupier=occupier,
                member_type="ADMIN"
            )
        def update(self,instance,validated_data):
            instance.description = validated_data.get('description',instance.description)
            instance.clique_level = validated_data.get('clique_level',instance.clique_level)
            instance.save()
            return instance
        



class PostReadOnlySerializer():
    occupier = Occupier()
    clique = CliqueReadOnlySerializer(required=False)


    class Meta:
        model = Post
        fields = ('caption','content','occupier','clique','posted','status')


class PostHeavySerializer(serializers.ModelSerializer):
    post = PostReadOnlySerializer
    class Meta:
        model = Post
        fields = ('id',  'post', 'created_at')




