from django.urls import  path,include
from .views import  CliqueView,CliqueList,CliqueSearch,CliqueViewSet,PostListCreateView,PostRetrieveUpdateDeleteView,CliqueListCreateView,CliqueRetrieveUpdateDeleteView,ListPostsOfClique,PostList
from rest_framework.routers import DefaultRouter, SimpleRouter
app_name="Occupy"
from . import views
from .views import *
router = DefaultRouter()
router.register('clique', CliqueViewSet)





urlpatterns = [
  path('clique/', include(router.urls)),
  #path('clique', CliqueView.as_view()),
  path('cliques-list',views.CliqueListCreateView.as_view(),name='list_cliques'),
  path('post-create', views.PostListCreateView.as_view(), name='list_posts'),
   path('post-list',views.PostList.as_view(), name='create-posts'),
  path(
      "<int:pk>/", views.PostRetrieveUpdateDeleteView.as_view(),
      name='post_detail'
      ),
  path('cliques/<int:pk>',views.CliqueRetrieveUpdateDeleteView.as_view(),name='clique_detail'),
  path('current-occupier/',views.get_posts_for_current_occupier, name='current_occupier'),
  path('search', CliqueSearch.as_view()),
  path('<str:name>',DetailClique.as_view(),name='clique-detail'),
  path('<str:name>/posts',ListPostsOfClique.as_view(), name='clique_posts'),
  path('post_comment_list/',views.CommentPostView.as_view(),)
]


