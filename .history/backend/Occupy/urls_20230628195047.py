from django.urls import  path,include
from .views import  CliqueView,CliqueList,CliqueSearch,CliqueViewSet,PostListCreateView,PostRetrieveUpdateDeleteView
from rest_framework.routers import DefaultRouter, SimpleRouter
app_name="Occupy"
from . import views

router = DefaultRouter()
router.register('clique', CliqueViewSet)





urlpatterns = [
  path('clique/', include(router.urls)),
  path('post', PostView.as_view()),
  path('clique', CliqueView.as_view()),
  path('post-list', views.PostListCreateView.as_view(), name='list_posts'),
  path(
      "<int:pk>/", views.PostRetrieveUpdateDeleteView.as_view(),
      name='post_detail'
      ),

  path('get-clique', CliqueList.as_view()),
  path('search', CliqueSearch.as_view()),
]


