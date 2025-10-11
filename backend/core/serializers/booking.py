"""
Serializers for Booking model.
"""

from typing import Any, Dict
from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Booking, Service

User = get_user_model()


class BookingListSerializer(serializers.ModelSerializer):
    """Serializer for listing bookings."""

    service = serializers.SerializerMethodField()
    client = serializers.SerializerMethodField()
    provider = serializers.SerializerMethodField()
    clique_name = serializers.CharField(source="clique.name", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "service",
            "clique",
            "clique_name",
            "client",
            "provider",
            "date",
            "start_time",
            "end_time",
            "status",
            "notes",
            "created",
            "modified",
        ]
        read_only_fields = [
            "id",
            "client",
            "provider",
            "created",
            "modified",
        ]

    def get_service(self, obj: Booking) -> Dict[str, Any]:
        """Get basic service info."""
        return {
            "id": obj.service.id,
            "title": obj.service.title,
            "price": obj.service.price,
            "duration_minutes": obj.service.duration_minutes,
        }

    def get_client(self, obj: Booking) -> Dict[str, Any]:
        """Get basic client info."""
        return {
            "id": obj.client.id,
            "username": obj.client.username,
            "email": obj.client.email,
            "profile_image": obj.client.profile_image,
        }

    def get_provider(self, obj: Booking) -> Dict[str, Any]:
        """Get basic provider info."""
        return {
            "id": obj.provider.id,
            "username": obj.provider.username,
            "email": obj.provider.email,
            "profile_image": obj.provider.profile_image,
        }


class BookingDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for a single booking."""

    service = serializers.SerializerMethodField()
    client = serializers.SerializerMethodField()
    provider = serializers.SerializerMethodField()
    clique = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "service",
            "clique",
            "client",
            "provider",
            "date",
            "start_time",
            "end_time",
            "status",
            "notes",
            "cancellation_reason",
            "created",
            "modified",
        ]
        read_only_fields = [
            "id",
            "client",
            "provider",
            "created",
            "modified",
        ]

    def get_service(self, obj: Booking) -> Dict[str, Any]:
        """Get detailed service info."""
        return {
            "id": obj.service.id,
            "title": obj.service.title,
            "description": obj.service.description,
            "price": obj.service.price,
            "duration_minutes": obj.service.duration_minutes,
        }

    def get_client(self, obj: Booking) -> Dict[str, Any]:
        """Get basic client info."""
        return {
            "id": obj.client.id,
            "username": obj.client.username,
            "email": obj.client.email,
            "profile_image": obj.client.profile_image,
        }

    def get_provider(self, obj: Booking) -> Dict[str, Any]:
        """Get basic provider info."""
        return {
            "id": obj.provider.id,
            "username": obj.provider.username,
            "email": obj.provider.email,
            "profile_image": obj.provider.profile_image,
        }

    def get_clique(self, obj: Booking) -> Dict[str, Any]:
        """Get basic clique info."""
        return {
            "id": obj.clique.id,
            "name": obj.clique.name,
            "description": obj.clique.description,
            "image": obj.clique.image,
        }


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bookings."""

    service_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Booking
        fields = [
            "service_id",
            "date",
            "start_time",
            "end_time",
            "notes",
        ]

    def validate_service_id(self, value: int) -> int:
        """Validate that the service exists and is active."""
        try:
            service = Service.objects.get(id=value)
            if not service.is_active:
                raise serializers.ValidationError("This service is not available.")

            # Validate that the user is not the clique owner
            request = self.context.get("request")
            if request and request.user.is_authenticated:
                if service.clique.occupier == request.user:
                    raise serializers.ValidationError(
                        "You cannot book your own service."
                    )

            return value
        except Service.DoesNotExist:
            raise serializers.ValidationError("Service with this ID does not exist.")

    def validate(self, attrs):
        """Validate booking time and availability."""
        if attrs["end_time"] <= attrs["start_time"]:
            raise serializers.ValidationError("End time must be after start time.")

        # TODO: Add validation for availability and overlapping bookings

        return attrs

    def create(self, validated_data: Dict[str, Any]):
        """Create a new booking."""
        service_id = validated_data.pop("service_id")
        service = Service.objects.get(id=service_id)

        # Booking will be created with client, provider, and clique set by the view
        booking = Booking.objects.create(
            service=service,
            clique=service.clique,
            provider=service.provider,
            **validated_data,
        )
        return booking