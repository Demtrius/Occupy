from django.urls import path
from .views import (
    OccupierListView,
)

app_name = "Occupier"

urlpatterns = [
    path("occupier-list/", OccupierListView.as_view(), name="occupier"),
]
