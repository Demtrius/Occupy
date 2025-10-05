from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import OccupierSerializer
from .models import Occupier
from rest_framework import generics


class OccupierListView(generics.ListCreateAPIView):
    queryset = Occupier.objects.all()
    serializer_class = OccupierSerializer

    def list(self, request):
        queryset = self.get_queryset()
        serializer = OccupierSerializer(queryset, many=True)
        return Response(serializer.data)
