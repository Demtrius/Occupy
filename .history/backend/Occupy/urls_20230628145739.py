from django.urls import  path,include
from .views import  PostView,CliqueView,CliqueList,CliqueSearch,CliqueViewSet
from rest_framework.routers import DefaultRouter, SimpleRouter
app_name="Occupy"
from . import views

router = DefaultRouter()
router.register('clique', CliqueViewSet)





urlpatterns = [
  path('clique/', include(router.urls)),
  path('post', PostView.as_view()),
  path('clique', CliqueView.as_view()),
  path(),
  path('get-clique', CliqueList.as_view()),
  path('search', CliqueSearch.as_view()),
]


