"""
Serializers for Review model.
"""

from typing import Any, Dict
from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Review, Booking

User = get_user_model()


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review model."""

    reviewer = serializers.SerializerMethodField()
    clique_name = serializers.CharField(source="clique.name", read_only=True)
    booking_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "booking",
            "booking_id",
            "clique",
            "clique_name",
            "reviewer",
            "rating",
            "comment",
            "created",
            "modified",
        ]
        read_only_fields = [
            "id",
            "booking",
            "clique",
            "reviewer",
            "created",
            "modified",
        ]
        extra_kwargs = {
            "booking": {"read_only": True},
        }

    def get_reviewer(self, obj: Review) -> Dict[str, Any]:
        """Get basic reviewer info."""
        return {
            "id": obj.user.id,
            "username": obj.user.username,
            "email": obj.user.email,
            "profile_image": obj.user.profile_image,
        }

    def validate_rating(self, value):
        """Validate rating is between 1 and 5."""
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_booking_id(self, value):
        """Validate that the booking exists and belongs to the user."""
        request = self.context.get("request")
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required.")

        try:
            booking = Booking.objects.get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError("Booking not found.")

        # Check if user is the client of this booking
        if booking.client != request.user:
            raise serializers.ValidationError("You can only review your own bookings.")

        # Check if booking is completed
        if booking.status != "completed":
            raise serializers.ValidationError("You can only review completed bookings.")

        # Check if review already exists
        if hasattr(booking, "review"):
            raise serializers.ValidationError("You have already reviewed this booking.")

        return value

    def create(self, validated_data):
        """Create review with booking and clique associations."""
        booking_id = validated_data.pop("booking_id")
        booking = Booking.objects.get(id=booking_id)

        validated_data["booking"] = booking
        validated_data["clique"] = booking.clique
        validated_data["user"] = self.context["request"].user

        return super().create(validated_data)