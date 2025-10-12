"""
Views for Availability model.
"""

from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import QuerySet

from authentication.backends import CustomJWTAuthentication
from ..models import Availability
from ..serializers.availability import AvailabilitySerializer


class AvailabilityPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "limit"


class AvailabilityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing availability slots.

    Service providers can set their availability for bookings.
    """

    queryset = Availability.objects.select_related("clique", "provider").all()
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    authentication_classes = [CustomJWTAuthentication]
    pagination_class = AvailabilityPagination
    filter_backends = []  # Will be imported if needed
    filterset_fields = ["clique", "provider", "date", "day_of_week", "is_recurring"]
    ordering_fields = ["date", "start_time"]
    ordering = ["date", "start_time"]

    def get_queryset(self) -> QuerySet:
        """Get queryset with optional filtering."""
        queryset = super().get_queryset()

        # Filter by clique
        clique_id = self.request.query_params.get("clique_id")
        if clique_id:
            queryset = queryset.filter(clique_id=clique_id)

        # Filter by date range
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date and end_date:
            queryset = queryset.filter(date__gte=start_date, date__lte=end_date)

        return queryset

    def perform_create(self, serializer) -> None:
        """Create availability with the current user as provider."""
        serializer.save(provider=self.request.user)

    def perform_update(self, serializer) -> None:
        """Update availability (only by the owner)."""
        instance = self.get_object()
        if instance.provider != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "You can only update your own availability."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer.save()

    def perform_destroy(self, instance: Availability) -> None:
        """Delete availability (only by owner or admin)."""
        if instance.provider != self.request.user and not self.request.user.is_staff:
            return Response(
                {"detail": "You can only delete this availability."},
                status=status.HTTP_403_FORBIDDEN,
            )
        instance.delete()
