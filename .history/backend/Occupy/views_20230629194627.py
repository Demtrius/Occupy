from django.shortcuts import render,get_object_or_404
from rest_framework import generics, serializers,status,mixins
from .serializers import PostSerializer,CliqueSerializer,CurrentOccupierPostsSerializer
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
from rest_framework.decorators import  api_view, APIView,permission_classes
from rest_framework.request import Request
# Create your views here.















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


class PostListCreateView(generics.GenericAPIView,mixins.ListModelMixin,mixins.CreateModelMixin):


    """ 
    A view for creating and listing posts
    """
    serializer_class = PostSerializer
    queryset = Post.objects.all()

    def get (self,request:Request,*args,**kwargs):
        return self.list(request,*args,**kwargs)
    
    def post(self,request:Request,*args,**kwargs):
        return self.create(request,*args,**kwargs)



        

class PostRetrieveUpdateDeleteView(generics.GenericAPIView, mixins.RetrieveModelMixin, mixins.UpdateModelMixin,mixins.DestroyModelMixin):
    serializer_class = PostSerializer
    queryset = Post.objects.all()
    permission_classes = [IsAuthenticated]

    def perform_create(self,serializer):
        occupier = self.request.user
        serializer.save(occupier=occupier)
        return super().perform_create(serializer)

    def get(self,request:Request,*args,**kwargs):
        return self.retrieve(request,*args,**kwargs)
    
    def put(self,request:Request, *args,**kwargs):
        return self.update(request,*args,**kwargs)
    
    def delete(self,request:Request,*args,**kwargs):
        return self.destroy(request, *args,**kwargs)


    

class CliqueListCreateView(generics.GenericAPIView,mixins.ListModelMixin,mixins.CreateModelMixin):
    """
    A view for creating and listing cliques
    """

    serializer_class = CliqueSerializer
    queryset = Clique.objects.all()

    def get(self,request:Request,*args,**kwargs):
        return self.list(request,*args,**kwargs)
    

    def post(self,request:Request,*args,**kwargs):
        return self.create(request,*args,**kwargs)
    
class CliqueRetrieveUpdateDeleteView(generics.GenericAPIView, mixins.RetrieveModelMixin, mixins.UpdateModelMixin,mixins.DestroyModelMixin):
    serializer_class = CliqueSerializer
    queryset = Clique.objects.all()

    def get(self,request:Request,*args,**kwargs):
        return self.retrieve(request,*args,**kwargs)
    
    def put(self,request:Request, *args,**kwargs):
        return self.update(request,*args,**kwargs)
    
    def delete(self,request:Request,*args,**kwargs):
        return self.destroy(request, *args,**kwargs)

        

@api_view(http_method_names=['GET'])
@permission_classes([IsAuthenticated])
def get_posts_for_current_occupier(request:Request):
    pass

