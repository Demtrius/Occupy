from django.shortcuts import render,get_object_or_404
from rest_framework import generics, serializers,status,mixins
from .serializers import PostSerializer,CliqueSerializer
from .models import  Post,Clique,CliquePost
from rest_framework.views import APIView
from rest_framework.views import  Response
from rest_framework.permissions import IsAuthenticated
from django.http import Http404
from django.views.generic.list import ListView
import django_filters.rest_framework
from rest_framework import filters
from rest_framework import viewsets
from rest_framework import generics
from rest_framework.decorators import action
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.generic.detail import DetailView
from django.views import generic
from django.views.generic import *
from rest_framework.decorators import  api_view, APIView
from rest_framework.request import Request
# Create your views here.









class PostView(generics.CreateAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer






class CliqueViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    queryset = Post.objects.all()
    lookup_field = 'name'

@action(detail=True, methods=["GET"])
def clique(self,request,id=None):
    post = self.get_object()
    cliques = Clique.objects.filter(post=post)
    serializer  = CliqueSerializer(cliques,many=True)
    return Response(serializer.data,status=200)




class CliqueView(generics.CreateAPIView):
     queryset = Clique.objects.all()
     serializer_class = CliqueSerializer
    
class CliqueList(APIView):
    def get(self,request,format=None):
        cliques = Clique.objects.all()
        serializer = CliqueSerializer(cliques,many=True)
        return Response(serializer.data)




class CliqueSearch(generics.ListAPIView):
    queryset = Clique.objects.all()
    serializer_class = CliqueSerializer
    filter_backends = [filters.SearchFilter]
    search_fields =  ['name']


class PostListCreateView(APIView):


    """ 
    A view for creating and listing posts
    """
    serializer_class = PostSerializer


    def get(self, request:Request,*args, **kwargs):
        posts = Post.objects.all()

        serializer = self.serializer_class(instance=posts,many='True')

        return Response(data=serializer.data,status=status.HTTP_200_OK)

    def post(self, request:Request,*args,**kwargs):
        data = request.data

        serializer = self.serializer_class(data=data)

        if serializer.is_valid():
            
            response = {
                "message" : "Post created",
                "data": serializer.data
            }

            return Response(data=response, status=status.HTTP_201_CREATED)
        

class PostRetrieveUpdateDeleteView(APIView):
    serializer_class = PostSerializer

    def get(self, request:Request,post_id:int):
        post  = get_object_or_404(Post, pk=post_id)
        serializer = self.serializer_class(instance=post)

        return Response(data=serializer.data,status=status.HTTP_200_OK)

    def put(self, request:Request,post_id:int):
        post  = get_object_or_404(Post, pk=post_id)
        data = request.data
        serializer = self.serializer_class(
            instance=post,
            data=data,
        )

        if serializer.is_valid():
            serializer.save()
        
        response = {
            "message" : "Post Updated",
            "data": serializer.data
        }
        
        return Response(data=response, status=status.HTTP_200_OK)

    def delete (self, request:Request,post_id:int):
        pass

    

