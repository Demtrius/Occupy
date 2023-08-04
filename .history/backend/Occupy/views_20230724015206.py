from django.shortcuts import render,get_object_or_404
from rest_framework import generics, serializers,status,mixins
from .serializers import PostSerializer,CliqueSerializer,PostSerializer_detailed,CurrentCliqueSerializer,CliqueSerializer_detailed
from Occupier.serializers import CurrentOccupierSerializer
from .models import  Post,Clique
from Occupier.models import Occupier
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
from rest_framework import viewsets
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
    permission_classes = [IsAuthenticated]

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
        serializer.save(occupierr=occupier)
        return super().perform_create(serializer)

    def get(self,request:Request,*args,**kwargs):
        return self.retrieve(request,*args,**kwargs)
    
    def put(self,request:Request, *args,**kwargs):
        return self.update(request,*args,**kwargs)
    
    def delete(self,request:Request,*args,**kwargs):
        return self.destroy(request, *args,**kwargs)








#gets posts for the current logged in user
@api_view(http_method_names=['GET'])
@permission_classes([IsAuthenticated])
def get_posts_for_current_occupier(request:Request):
    user = request.user
    serializer = CurrentOccupierSerializer(instance=user)

    return Response(
        data= serializer.data,
        status = status.HTTP_200_OK
    )
    

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

        


class ListHomePosts(generics.ListAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer_detailed

    def get_queryset(self):
        return Post.objects.filter(occupier = self.kwargs['username']).order_by('posted')
    
class ListCliquesOfUser(generics.ListAPIView):
    queryset = Clique.objects.all()
    serializer_class = CliqueSerializer

    def get_queryset(self):
        return Clique.objects.filter(occupier = self.kwargs['username']).order_by('name')
    


# @api_view(http_method_names=['GET'])
# @permission_classes([IsAuthenticated])
# def get_posts_for_current_occupier(request:Request):
#     user = request.user
#     serializer = CurrentOccupierSerializer(instance=user)

#     return Response(
#         data= serializer.data,
#         status = status.HTTP_200_OK
#     )

@api_view(http_method_names=['GET'])
def get_posts_for_clique(request:Request):
    user = request.user
    serializer = CurrentCliqueSerializer(instance=Occupier)




    return Response(
        data= serializer.data,
        status = status.HTTP_200_OK
    )

class DetailClique(generics.RetrieveUpdateDestroyAPIView):
    queryset = Clique.objects.all()
    lookup_field = 'name'
    lookup_url_kwarg = 'name'

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CliqueSerializer_detailed
        return CliqueSerializer
    
class ListPostsOfClique():
    pass