"""
Serializers for Service model.
"""

from typing import Any, Dict
from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Service

User = get_user_model()


class ServiceListSerializer(serializers.ModelSerializer):
    """Serializer for listing services."""

    provider = serializers.SerializerMethodField()
    clique_name = serializers.CharField(source="clique.name", read_only=True)
    bookings_count = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id",
            "clique",
            "clique_name",
            "provider",
            "title",
            "description",
            "price",
            "duration_minutes",
            "is_active",
            "bookings_count",
            "created",
            "modified",
        ]
        read_only_fields = ["id", "provider", "created", "modified"]

    def get_provider(self, obj: Service) -> Dict[str, Any]:
        """Get basic provider info."""
        profile_image_url = ""
        if obj.provider.profile_image and obj.provider.profile_image.name:
            profile_image_url = obj.provider.profile_image.url

        return {
            "id": obj.provider.id,
            "username": obj.provider.username,
            "email": obj.provider.email,
            "profile_image": profile_image_url,
        }

    def get_bookings_count(self, obj) -> int:
        """Get the count of bookings for this service."""
        return obj.bookings.count()


class ServiceDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for a single service."""

    provider = serializers.SerializerMethodField()
    clique = serializers.SerializerMethodField()
    bookings_count = serializers.SerializerMethodField()
    available_slots = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id",
            "clique",
            "provider",
            "title",
            "description",
            "price",
            "duration_minutes",
            "is_active",
            "bookings_count",
            "available_slots",
            "created",
            "modified",
        ]
        read_only_fields = ["id", "provider", "created", "modified"]

    def get_provider(self, obj: Service) -> Dict[str, Any]:
        """Get basic provider info."""
        profile_image_url = ""
        if obj.provider.profile_image and obj.provider.profile_image.name:
            profile_image_url = obj.provider.profile_image.url

        return {
            "id": obj.provider.id,
            "username": obj.provider.username,
            "email": obj.provider.email,
            "profile_image": profile_image_url,
        }

    def get_clique(self, obj: Service) -> Dict[str, Any]:
        """Get basic clique info."""
        image_url = ""
        if obj.clique.image and obj.clique.image.name:
            image_url = obj.clique.image.url

        return {
            "id": obj.clique.id,
            "name": obj.clique.name,
            "description": obj.clique.description,
            "image": image_url,
        }

    def get_bookings_count(self, obj) -> int:
        """Get the count of bookings for this service."""
        return obj.bookings.count()

    def get_available_slots(self, obj) -> int:
        """Get count of available slots for this service."""
        # Placeholder - implement slot calculation logic
        return 0


class ServiceCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating services."""

    clique_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Service
        fields = [
            "clique_id",
            "title",
            "description",
            "price",
            "duration_minutes",
            "is_active",
        ]

    def validate_clique_id(self, value: int) -> int:
        """Validate that the clique exists and user is the owner."""
        from ..models import Clique

        try:
            clique = Clique.objects.get(id=value)
            request = self.context.get("request")
            if request and request.user.is_authenticated:
                if clique.occupier != request.user:
                    raise serializers.ValidationError(
                        "You must be the owner of this clique to add services."
                    )
            return value
        except Clique.DoesNotExist:
            raise serializers.ValidationError("Clique with this ID does not exist.")

    def create(self, validated_data: Dict[str, Any]):
        """Create a new service."""
        clique_id = validated_data.pop("clique_id")
        from ..models import Clique
        clique = Clique.objects.get(id=clique_id)

        # Provider and clique are set by the view
        service = Service.objects.create(clique=clique, **validated_data)
        return service