from django.shortcuts import render,get_object_or_404
from rest_framework import generics, serializers,status,mixins
from .serializers import PostSerializer,CliqueSerializer,PostSerializer_detailed,CurrentCliqueSerializer,CliqueSerializer_detailed,CommentPostSerializer,FollowSerializer,JoinCliqueSerializer,ReviewSerializer
from Occupier.serializers import CurrentOccupierSerializer
from .models import  Post,Clique,CommentPost,Follow,Review
from Occupier.models import Occupier
from rest_framework.views import APIView
from rest_framework.views import  Response
from rest_framework.permissions import IsAuthenticated,IsAuthenticatedOrReadOnly
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
from django.http import HttpResponse, JsonResponse
from rest_framework.viewsets import ModelViewSet
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

import json
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

class PostList(APIView):
    def get(self,request,format=None):
        posts = Post.objects.all()
        serializer = PostSerializer(posts,many=True)
        return Response(serializer.data)


class PostListCreateView(generics.GenericAPIView,mixins.CreateModelMixin):


    """ 
    A view for creating and listing posts
    """
    serializer_class = PostSerializer
    queryset = Post.objects.all()
    # permission_classes = [IsAuthenticated]

    # def get (self,request:Request,*args,**kwargs):
    #     return self.list(request,*args,**kwargs)
    
    def post(self,request:Request,*args,**kwargs):
        print(request.data)
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

        



    

    




@api_view(http_method_names=['GET'])
def get_posts_for_clique(request:Request):
    user = request.user
    serializer = CurrentCliqueSerializer(instance=clique)

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
    
class ListPostsOfClique(generics.ListAPIView,mixins.RetrieveModelMixin):
    serializer_class = CurrentCliqueSerializer
    queryset = Clique.objects.all()
    lookup_field = 'id'

    def get(self,request:Request,*args,**kwargs):
        return self.retrieve(request,*args,**kwargs)
    

class CommentPostView(generics.ListCreateAPIView):
    serializer_class = CommentPostSerializer
    queryset = CommentPost.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        return CommentPost.objects.filter(post_id=post_id)
    
    def perform_create(self,serializer):
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Post, id=post_id)

        if CommentPost.objects.filter(post=post, occupier=self.request.user).exists():
            raise serializers.ValidationError({'Message': 'You have already added comment on this post'})
        serializer.save(occupier=self.request.user, post=post)




    
    


class FollowViewSet(viewsets.ModelViewSet):
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return only the follow relationships for the current user
        return Follow.objects.filter(follower=self.request.user)

def create(self, request):
        """Follow a user."""
        username = request.data.get('username')
        
        # Ensure the `username` is provided in the request data
        if not username:
            return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get the user to be followed
            following = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if the user is already following this user
        if Follow.objects.filter(follower=request.user, following=following).exists():
            return Response({"error": "You are already following this user"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the follow relationship and set the `follower` to `request.user`
        follow = Follow(follower=request.user, following=following)
        follow.save()
        
        return Response(FollowSerializer(follow).data, status=status.HTTP_201_CREATED)

def destroy(self, request, *args, **kwargs):
        # Unfollow a user
        followed_user_id = kwargs.get('pk')
        try:
            follow = Follow.objects.get(follower=request.user, followed_id=followed_user_id)
            follow.delete()
            return Response({"detail": "Unfollowed successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Follow.DoesNotExist:
            return Response({"detail": "You are not following this user."}, status=status.HTTP_400_BAD_REQUEST)



class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Occupier.objects.all()
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def followers(self, request, pk=None):
        user = self.get_object()
        followers = user.followers.all()
        serializer = FollowSerializer(followers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def following(self, request, pk=None):
        user = self.get_object()
        following = user.following.all()
        serializer = FollowSerializer(following, many=True)
        return Response(serializer.data)



class JoinCliqueView(generics.GenericAPIView):
    serializer_class = JoinCliqueSerializer
    # permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        clique = serializer.save()
        return Response(
            {"message": f"You have successfully joined the clique: {clique.name}"},
            status=status.HTTP_200_OK
        )
class ReviewView(generics.GenericAPIView):
    serializer_class = ReviewSerializer



    def post(self, request, *args, **kwargs):
        serializer = ReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Review submitted successfully."},
            status=status.HTTP_201_CREATED
        )
    def list_reviews_for_cliques(self,request,clique_id):
        """
        Fetch and return all reviews associated with a given clique ID.
        """
        # Filter reviews by clique_id
        reviews = Review.objects.filter(clique_id=clique_id)
        
        # Check if reviews exist for the provided clique_id
        if not reviews.exists():
            return Response(
                {"message": f"No reviews found for clique ID {clique_id}."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Serialize the data
        serializer = self.serializer_class(reviews, many=True)
        
        # Return the serialized reviews
        return Response(serializer.data, status=status.HTTP_200_OK)


 
        
    


    