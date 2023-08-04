from dataclasses import field
from typing import final
from django.db import models
from rest_framework import fields, serializers
from .models import Clique,Post
from Occupier.models import Occupier
from rest_framework.validators import UniqueTogetherValidator
# from serializers import 

# from drf_writable_nested import WritableNestedModelSerializer






class PostSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ('content', 'caption',  'clique' , 'status','id','occupier')



class CliqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clique
        fields = ('name', 'created_at', 'level','id','occupation')









       













