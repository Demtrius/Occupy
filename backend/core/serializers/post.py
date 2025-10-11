"""
Serializers for Post-related models.
"""

from typing import Any, Dict
from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Post, Like, CommentPost

User = get_user_model()


class PostListSerializer(serializers.ModelSerializer):
    """Serializer for listing posts with basic information."""

    occupier = serializers.SerializerMethodField()
    clique = serializers.CharField(source="clique.name", read_only=True)
    clique_id = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "content",
            "caption",
            "occupier",
            "clique",
            "clique_id",
            "created",
            "likes_count",
            "comments_count",
            "is_liked",
            "modified",
        ]

    def get_occupier(self, obj: Post) -> Dict[str, Any]:
        """Get basic occupier info."""
        profile_image_url = ""
        if obj.occupier.profile_image and obj.occupier.profile_image.name:
            profile_image_url = obj.occupier.profile_image.url

        return {
            "id": obj.occupier.id,
            "username": obj.occupier.username,
            "email": obj.occupier.email,
            "profile_image": profile_image_url,
        }

    def get_clique_id(self, obj: Post) -> int:
        """Get the clique's ID."""
        return obj.clique.id

    def get_created(self, obj: Post) -> str:
        """Get a human-readable time since post was created."""
        from django.utils import timezone
        import datetime

        now = timezone.now()
        diff = now - obj.created

        if diff < datetime.timedelta(minutes=1):
            return "Just now"
        elif diff < datetime.timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes}m ago"
        elif diff < datetime.timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours}h ago"
        elif diff < datetime.timedelta(days=7):
            days = diff.days
            return f"{days}d ago"
        elif diff < datetime.timedelta(days=30):
            weeks = diff.days // 7
            return f"{weeks}w ago"
        else:
            return obj.created.strftime("%b %d, %Y")

    def get_likes_count(self, obj: Post) -> int:
        """Get the count of likes on this post."""
        return obj.likes.count()

    def get_comments_count(self, obj: Post) -> int:
        """Get the number of comments on this post."""
        return obj.comments.count()

    def get_is_liked(self, obj: Post) -> bool:
        """Check if the current user has liked this post."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


class PostDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for a single post."""

    occupier = serializers.SerializerMethodField()
    clique = serializers.SerializerMethodField()
    clique_id = serializers.SerializerMethodField()
    created = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "content",
            "caption",
            "status",
            "occupier",
            "clique",
            "clique_id",
            "created",
            "likes_count",
            "comments_count",
            "is_liked",
            "modified",
        ]

    def get_occupier(self, obj: Post) -> Dict[str, Any]:
        """Get basic occupier info."""
        profile_image_url = ""
        if obj.occupier.profile_image and obj.occupier.profile_image.name:
            profile_image_url = obj.occupier.profile_image.url

        return {
            "id": obj.occupier.id,
            "username": obj.occupier.username,
            "email": obj.occupier.email,
            "profile_image": profile_image_url,
        }

    def get_clique_id(self, obj: Post) -> int:
        """Get the clique's ID."""
        return obj.clique.id

    def get_clique(self, obj: Post) -> str:
        """Get clique name."""
        return obj.clique.name

    def get_created(self, obj: Post) -> str:
        """Get a human-readable time since post was created."""
        from django.utils import timezone
        import datetime

        now = timezone.now()
        diff = now - obj.created

        if diff < datetime.timedelta(minutes=1):
            return "Just now"
        elif diff < datetime.timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes}m ago"
        elif diff < datetime.timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours}h ago"
        elif diff < datetime.timedelta(days=7):
            days = diff.days
            return f"{days}d ago"
        elif diff < datetime.timedelta(days=30):
            weeks = diff.days // 7
            return f"{weeks}w ago"
        else:
            return obj.created.strftime("%b %d, %Y")

    def get_likes_count(self, obj: Post) -> int:
        """Get the count of likes on this post."""
        return obj.likes.count()

    def get_comments_count(self, obj: Post) -> int:
        """Get the count of comments on this post."""
        return obj.comments.count()

    def get_is_liked(self, obj: Post) -> bool:
        """Check if the current user has liked this post."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False


# Input serializers are defined in the views since validation is moved to services


class LikeSerializer(serializers.ModelSerializer):
    """Serializer for Like model."""

    user = serializers.SerializerMethodField()

    class Meta:
        model = Like
        fields = ["id", "post", "user", "created"]

    def get_user(self, obj: Like) -> Dict[str, Any]:
        """Get basic user info."""
        profile_image_url = ""
        if obj.user.profile_image and obj.user.profile_image.name:
            profile_image_url = obj.user.profile_image.url

        return {
            "id": obj.user.id,
            "username": obj.user.username,
            "email": obj.user.email,
            "profile_image": profile_image_url,
        }


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for CommentPost model."""

    user = serializers.SerializerMethodField()
    content = serializers.CharField(source='body')

    class Meta:
        model = CommentPost
        fields = ["id", "post", "user", "content", "created"]

    def get_user(self, obj: CommentPost) -> Dict[str, Any]:
        """Get basic user info."""
        profile_image_url = ""
        if obj.occupier.profile_image and obj.occupier.profile_image.name:
            profile_image_url = obj.occupier.profile_image.url

        return {
            "id": obj.occupier.id,
            "username": obj.occupier.username,
            "email": obj.occupier.email,
            "profile_image": profile_image_url,
        }