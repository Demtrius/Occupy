from django.urls import  path,include
from .views import  CliqueView,CliqueList,CliqueSearch,CliqueViewSet,PostListCreateView,PostRetrieveUpdateDeleteView,CliqueListCreateView,CliqueRetrieveUpdateDeleteView,ListPostsOfClique,PostList,JoinCliqueView,ReviewView
from rest_framework.routers import DefaultRouter, SimpleRouter
app_name="Occupy"
from . import views
from .views import *


router = DefaultRouter()
router.register(r'follows', FollowViewSet, basename='follow')




follow_list = FollowViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

follow_detail = FollowViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'delete': 'destroy'
})


urlpatterns = [
  path('clique/', include(router.urls)),
  #path('clique', CliqueView.as_view()),
  path('cliques-list',views.CliqueListCreateView.as_view(),name='list_cliques'),
  path('post-create', views.PostListCreateView.as_view(), name='list_posts'),
   path('post-list',views.PostList.as_view(), name='create-posts'),
  path(
      "posts/<int:pk>/", views.PostRetrieveUpdateDeleteView.as_view(),
      name='post_detail'
      ),
  path('cliques/<int:pk>',views.CliqueRetrieveUpdateDeleteView.as_view(),name='clique_detail'),
  path('current-occupier/',views.get_posts_for_current_occupier, name='current_occupier'),
  path('search', CliqueSearch.as_view()),
  path('<str:name>',DetailClique.as_view(),name='clique-detail'),
  path('<int:id>/posts',ListPostsOfClique.as_view(), name='clique_posts'),
  path('post_comment_list/<int:post_id>',views.CommentPostView.as_view(),name='comments'),
  path('', include(router.urls)),
  path('follows/', follow_list, name='follow-list'),
  path('follows/<int:pk>/', follow_detail, name='follow-detail'),
  path('cliques-join/',JoinCliqueView.as_view(),name='join_clique' ),
  path('review/',ReviewView.as_view(),name='review')
]


