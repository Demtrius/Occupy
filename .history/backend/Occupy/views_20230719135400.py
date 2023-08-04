from django.shortcuts import render,get_object_or_404
from rest_framework import generics, serializers,status,mixins
from .serializers import PostSerializer,CliqueSerializer,TagSerializer,CliqueCreateSerializer,CliqueHeavySerializer,PostReadOnlySerializer
from Occupier.serializers import CurrentOccupierSerializer
from .models import  Post,Clique,CliquePost,Tag
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
    
        
    def add_tag(self,request,uuid=None):
        post = self.get_object()
        occupier = request.occupier
        if not occupier.is_authenticated():
            return Response({"error": "User not authorized"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if post != occupier:
            return Response({"error": "Spoofing detected"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            tag = serializer.data.pop('tag', None)
            tag_obj = None
            if 'id' in tag.keys():
                tag_obj = Tag.objects.get(pk=tag['id'])
            else:
                tag_obj, created = Tag.objects.get_or_create(name=tag['name'])
            if tag_obj is not None and tag_obj not in post.tags.all():
                post.tags.add(tag_obj)
        except Exception as e:
            return Response({"error": str(e), "message": e.message}, status=status.HTTP_400_BAD_REQUEST)
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(tag_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

        

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

        



class TagViewSet(viewsets.BaseViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class CliqueViewSet(viewsets.BaseViewSet):
    queryset = Clique.objects.all().order_by('created_at')
    serializer_class = Clique
    serializer_action_classes = {
        'create': CliqueCreateSerializer,
        'update': CliqueCreateSerializer,
        'retrieve' : CliqueHeavySerializer,
        'posts': PostReadOnlySerializer
    }

    def list(self,request):
        queryset = self.queryset
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(queryset, many=True, context={'request': request })
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    def retrieve(self,request,pk=None):
        clique = self.get_object()
        serializer_class = self.get_serializer_class
        serializer = serializer_class(clique, context={'request':request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def create(self, request):
        data = request.data
        if not request.occupier.is_authenticated:
            return Response({
                'error':'The user is anonymous'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(data=data, context={'user': request.occupier })
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, pk=None):
        data = request.data
        if not request.occupier.is_authenticated:
            return Response({
                'error':'The user is anonymous'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(data=data, context={'user': request.occupier })
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self,request,pk=None):
        return Response(status=status.HTTP_403_FORBIDDEN)
    
    @action(detail=True)