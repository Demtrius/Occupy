"""
Serializers for the users app.
"""

from typing import Any, Dict
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for nested serialization."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "profile_image"]
        read_only_fields = ["id", "username", "email", "profile_image"]


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for listing users with basic information."""

    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "profile_image",
            "occupations",
            "is_business_page",
            "created",
            "followers_count",
            "following_count",
            "posts_count",
        ]
        read_only_fields = [
            "id",
            "email",
            "created",
            "followers_count",
            "following_count",
            "posts_count",
        ]

    def get_followers_count(self, obj: User) -> int:
        """Get the count of followers."""
        return obj.followers.count()

    def get_following_count(self, obj: User) -> int:
        """Get the count of following."""
        return obj.following.count()

    def get_posts_count(self, obj: User) -> int:
        """Get the count of posts by this user."""
        return obj.posts.count() if hasattr(obj, "posts") else 0


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for a single user."""

    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    cliques_count = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "profile_image",
            "occupations",
            "is_business_page",
            "private_account",
            "created",
            "followers_count",
            "following_count",
            "posts_count",
            "cliques_count",
            "is_following",
        ]
        read_only_fields = [
            "id",
            "email",
            "created",
            "followers_count",
            "following_count",
            "posts_count",
            "cliques_count",
            "is_following",
        ]

    def get_full_name(self, obj: User) -> str:
        """Get user's full name."""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username

    def get_followers_count(self, obj: User) -> int:
        """Get the count of followers."""
        return obj.followers.count()

    def get_following_count(self, obj: User) -> int:
        """Get the count of following."""
        return obj.following.count()

    def get_posts_count(self, obj: User) -> int:
        """Get the count of posts by this user."""
        return obj.posts.count() if hasattr(obj, "posts") else 0

    def get_cliques_count(self, obj: User) -> int:
        """Get the count of cliques the user is a member of."""
        return obj.cliques.count() if hasattr(obj, "cliques") else 0

    def get_is_following(self, obj: User) -> bool:
        """Check if the current user is following this user."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import Follow
            return Follow.objects.filter(follower=request.user, followed=obj).exists()
        return False


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "profile_image",
            "occupations",
            "private_account",
        ]

    def update(self, instance: User, validated_data: Dict[str, Any]) -> User:
        """Update user profile."""
        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)
        instance.profile_image = validated_data.get(
            "profile_image", instance.profile_image
        )
        instance.occupations = validated_data.get("occupations", instance.occupations)
        instance.private_account = validated_data.get(
            "private_account", instance.private_account
        )
        instance.save()
        return instance


class OccupationSerializer(serializers.Serializer):
    """Serializer for occupation data."""

    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField()
    category = serializers.CharField(default="General")
    user_count = serializers.IntegerField(default=0, read_only=True)

    class Meta:
        fields = ["id", "name", "category", "user_count"]
