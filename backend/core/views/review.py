"""
Views for Review model.
"""

from rest_framework import viewsets, permissions

from authentication.backends import CustomJWTAuthentication
from ..models import Review
from ..serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reviews.

    Provides CRUD operations for reviews with filtering by clique, booking, and user.
    """

    tags = ['Reviews']
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    authentication_classes = [CustomJWTAuthentication]
    filter_backends = []  # Will be imported if needed
    filterset_fields = ["clique", "booking", "rating"]
    ordering_fields = ["created", "rating"]
    ordering = ["-created"]

    def get_queryset(self):
        """Return reviews, optionally filtered."""
        queryset = Review.objects.select_related("user", "booking", "clique").all()

        # Filter by user's own reviews
        if self.request.query_params.get("user") == "me":
            queryset = queryset.filter(user=self.request.user)

        return queryset

    def perform_update(self, serializer):
        """Update review only if user is the owner."""
        if serializer.instance.user != self.request.user:
            raise permissions.PermissionDenied("You can only edit your own reviews.")
        serializer.save()

    def perform_destroy(self, instance: Review) -> None:
        """Delete review only if user is the owner."""
        if instance.user != self.request.user:
            raise permissions.PermissionDenied("You can only delete your own reviews.")
        instance.delete()