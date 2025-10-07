"""
Serializers for Availability model.
"""

from typing import Any, Dict
from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Availability

User = get_user_model()


class AvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for availability slots."""

    provider = serializers.SerializerMethodField()
    clique_name = serializers.CharField(source="clique.name", read_only=True)
    day_name = serializers.CharField(source="get_day_of_week_display", read_only=True)

    class Meta:
        model = Availability
        fields = [
            "id",
            "clique",
            "clique_name",
            "provider",
            "date",
            "start_time",
            "end_time",
            "is_recurring",
            "day_of_week",
            "day_name",
        ]
        read_only_fields = ["id", "provider"]

    def get_provider(self, obj: Availability) -> Dict[str, Any]:
        """Get basic provider info."""
        return {
            "id": obj.provider.id,
            "username": obj.provider.username,
            "email": obj.provider.email,
            "profile_image": obj.provider.profile_image,
        }

    def validate(self, attrs):
        """Validate that end_time is after start_time."""
        if attrs.get("start_time") and attrs.get("end_time"):
            if attrs["end_time"] <= attrs["start_time"]:
                raise serializers.ValidationError("End time must be after start time.")

        # If recurring, day_of_week must be set
        if attrs.get("is_recurring") and attrs.get("day_of_week") is None:
            raise serializers.ValidationError(
                "Day of week is required for recurring availability."
            )

        # If not recurring, date must be set
        if not attrs.get("is_recurring") and not attrs.get("date"):
            raise serializers.ValidationError(
                "Date is required for non-recurring availability."
            )

        return attrs