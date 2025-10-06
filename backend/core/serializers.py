"""
Serializers for the core app (Posts and Cliques).
"""

from typing import Any, Dict
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Post, Clique, CliquePost, CommentPost

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user information for nested serialization."""

    class Meta:
        model = User
        fields = ["id", "username", "email", "profile_image"]
        read_only_fields = ["id", "username", "email", "profile_image"]


class CliqueListSerializer(serializers.ModelSerializer):
    """Serializer for listing cliques with basic information."""

    members_count = serializers.SerializerMethodField()
    created_by = serializers.PrimaryKeyRelatedField(source="occupier", read_only=True)
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Clique
        fields = [
            "id",
            "name",
            "description",
            "image",
            "members_count",
            "created_by",
            "created_at",
            "updated_at",
            "is_member",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_members_count(self, obj: Clique) -> int:
        """Get the count of members in the clique."""
        return obj.members.count()

    def get_is_member(self, obj: Clique) -> bool:
        """Check if the current user is a member of this clique."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False


class CliqueDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for a single clique."""

    members_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    created_by = UserBasicSerializer(source="occupier", read_only=True)
    is_member = serializers.SerializerMethodField()
    members = UserBasicSerializer(many=True, read_only=True)

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
            "is_public",
            "created_at",
            "updated_at",
            "is_member",
        ]
        read_only_fields = ["id", "occupier", "created_at", "updated_at"]

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


class CliqueCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating cliques."""

    class Meta:
        model = Clique
        fields = ["name", "description", "image", "is_public"]

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


class PostListSerializer(serializers.ModelSerializer):
    """Serializer for listing posts with basic information."""

    occupier = serializers.CharField(source="occupier.username", read_only=True)
    clique = serializers.CharField(source="clique.name", read_only=True)
    user_id = serializers.IntegerField(source="occupier.id", read_only=True)
    clique_id = serializers.IntegerField(source="clique.id", read_only=True)
    avatar = serializers.CharField(source="occupier.profile_image", read_only=True)
    posted = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "content",
            "caption",
            "occupier",
            "clique",
            "user_id",
            "clique_id",
            "avatar",
            "posted",
            "likes_count",
            "comments_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_posted(self, obj: Post) -> str:
        """Get a human-readable time since post was created."""
        from django.utils import timezone
        import datetime

        now = timezone.now()
        diff = now - obj.created_at

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
            return obj.created_at.strftime("%b %d, %Y")

    def get_likes_count(self, obj: Post) -> int:
        """Get the count of likes on this post."""
        # Placeholder - implement when Like model is added
        return 0

    def get_comments_count(self, obj: Post) -> int:
        """Get the count of comments on this post."""
        return obj.comments.count() if hasattr(obj, "comments") else 0


class PostDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for a single post."""

    occupier = UserBasicSerializer(read_only=True)
    clique = CliqueListSerializer(read_only=True)
    user_id = serializers.IntegerField(source="occupier.id", read_only=True)
    clique_id = serializers.IntegerField(source="clique.id", read_only=True)
    avatar = serializers.CharField(source="occupier.profile_image", read_only=True)
    posted = serializers.SerializerMethodField()
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
            "user_id",
            "clique_id",
            "avatar",
            "posted",
            "status",
            "likes_count",
            "comments_count",
            "is_liked",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_posted(self, obj: Post) -> str:
        """Get a human-readable time since post was created."""
        from django.utils import timezone
        import datetime

        now = timezone.now()
        diff = now - obj.created_at

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
            return obj.created_at.strftime("%b %d, %Y")

    def get_likes_count(self, obj: Post) -> int:
        """Get the count of likes on this post."""
        # Placeholder - implement when Like model is added
        return 0

    def get_comments_count(self, obj: Post) -> int:
        """Get the count of comments on this post."""
        return obj.comments.count() if hasattr(obj, "comments") else 0

    def get_is_liked(self, obj: Post) -> bool:
        """Check if the current user has liked this post."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            # Placeholder - implement when Like model is added
            return False
        return False


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating posts."""

    clique_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Post
        fields = ["content", "caption", "clique_id", "status"]

    def validate_clique_id(self, value: int) -> int:
        """Validate that the clique exists."""
        try:
            clique = Clique.objects.get(id=value)
            # Check if user is a member of the clique
            request = self.context.get("request")
            if request and request.user.is_authenticated:
                if not clique.members.filter(id=request.user.id).exists():
                    raise serializers.ValidationError(
                        "You must be a member of this clique to post."
                    )
            return value
        except Clique.DoesNotExist:
            raise serializers.ValidationError("Clique with this ID does not exist.")

    def create(self, validated_data: Dict[str, Any]) -> Post:
        """Create a new post."""
        # Occupier is set by the view's perform_create method
        clique_id = validated_data.pop("clique_id")
        clique = Clique.objects.get(id=clique_id)

        post = Post.objects.create(clique=clique, **validated_data)
        return post

    def update(self, instance: Post, validated_data: Dict[str, Any]) -> Post:
        """Update an existing post."""
        # Don't allow changing the clique
        validated_data.pop("clique_id", None)

        instance.content = validated_data.get("content", instance.content)
        instance.caption = validated_data.get("caption", instance.caption)
        instance.status = validated_data.get("status", instance.status)
        instance.save()

        return instance


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments on posts."""

    occupier = UserBasicSerializer(read_only=True)

    class Meta:
        model = CommentPost
        fields = ["id", "post", "occupier", "body", "date"]
        read_only_fields = ["id", "occupier", "date"]

    def create(self, validated_data: Dict[str, Any]) -> CommentPost:
        """Create a new comment."""
        # Occupier and post are set by the view's action method
        comment = CommentPost.objects.create(**validated_data)
        return comment
