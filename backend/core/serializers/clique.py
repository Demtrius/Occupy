"""
Serializers for Clique-related models.
"""

from typing import Any, Dict
from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Clique
from users.serializers import UserBasicSerializer

User = get_user_model()


class CliqueListSerializer(serializers.ModelSerializer):
    """Serializer for listing cliques with basic information."""

    members_count = serializers.SerializerMethodField()
    created_by = serializers.PrimaryKeyRelatedField(source="occupier", read_only=True)
    is_member = serializers.SerializerMethodField()
    is_public = serializers.SerializerMethodField()

    class Meta:
        model = Clique
        fields = [
            "id",
            "name",
            "description",
            "image",
            "members_count",
            "created_by",
            "created",
            "modified",
            "is_member",
            "level",
            "is_public",
        ]
        read_only_fields = ["id", "created", "modified"]

    def get_members_count(self, obj: Clique) -> int:
        """Get the count of members in the clique."""
        return obj.members.count()

    def get_is_member(self, obj: Clique) -> bool:
        """Check if the current user is a member of this clique."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False

    def get_is_public(self, obj: Clique) -> bool:
        """Return true if the clique is public."""
        return obj.level == Clique.Type.PUBLIC


class CliqueDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for a single clique."""

    members_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    created_by = UserBasicSerializer(source="occupier", read_only=True)
    is_member = serializers.SerializerMethodField()
    members = UserBasicSerializer(many=True, read_only=True)
    is_public = serializers.SerializerMethodField()

    class Meta:
        model = Clique
        fields = [
            "id",
            "name",
            "description",
            "image",
            "occupier",
            "created_by",
            "members",
            "members_count",
            "posts_count",
            "level",
            "is_public",
            "created",
            "modified",
            "is_member",
        ]
        read_only_fields = ["id", "occupier", "created", "modified"]

    def get_members_count(self, obj: Clique) -> int:
        """Get the count of members in the clique."""
        return obj.members.count()

    def get_posts_count(self, obj: Clique) -> int:
        """Get the count of posts in the clique."""
        return obj.posts.count()

    def get_is_member(self, obj: Clique) -> bool:
        """Check if the current user is a member of this clique."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False

    def get_is_public(self, obj: Clique) -> bool:
        """Return true if the clique is public."""
        return obj.level == Clique.Type.PUBLIC


class CliqueCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating cliques."""

    class Meta:
        model = Clique
        fields = ["name", "description", "image", "level"]

    def create(self, validated_data: Dict[str, Any]) -> Clique:
        """Create a new clique with the current user as the occupier."""
        # Occupier is set by the view's perform_create method
        clique = Clique.objects.create(**validated_data)
        return clique

    def validate_name(self, value: str) -> str:
        """Validate that the clique name is unique."""
        if Clique.objects.filter(name=value).exists():
            if self.instance and self.instance.name == value:
                # Allow keeping the same name when updating
                return value
            raise serializers.ValidationError("A clique with this name already exists.")
        return value