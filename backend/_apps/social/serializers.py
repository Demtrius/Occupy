"""
Serializers for the social app.
"""

from rest_framework import serializers
from django.utils.text import slugify
from .models import (
    Clique,
    CliqueMembership,
    Post,
    PostLike,
    Comment,
    CommentLike,
    Follow,
    Review,
)


class CliqueListSerializer(serializers.ModelSerializer):
    """Serializer for clique list view."""

    creator_username = serializers.CharField(source="creator.username", read_only=True)
    member_count = serializers.ReadOnlyField()
    post_count = serializers.ReadOnlyField()

    class Meta:
        model = Clique
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "occupation",
            "privacy_level",
            "creator_username",
            "member_count",
            "post_count",
            "created_at",
        ]


class CliqueDetailSerializer(serializers.ModelSerializer):
    """Serializer for clique detail view."""

    creator = serializers.SerializerMethodField()
    member_count = serializers.ReadOnlyField()
    post_count = serializers.ReadOnlyField()
    is_member = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    recent_posts = serializers.SerializerMethodField()

    class Meta:
        model = Clique
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "occupation",
            "privacy_level",
            "allow_posts",
            "allow_reviews",
            "creator",
            "member_count",
            "post_count",
            "is_member",
            "user_role",
            "recent_posts",
            "created_at",
            "updated_at",
        ]

    def get_creator(self, obj):
        from apps.accounts.serializers import UserListSerializer

        return UserListSerializer(obj.creator).data

    def get_is_member(self, obj):
        """Check if the current user is a member."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.members.filter(id=request.user.id).exists()
        return False

    def get_user_role(self, obj):
        """Get the current user's role in the clique."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            try:
                membership = CliqueMembership.objects.get(user=request.user, clique=obj)
                return membership.role
            except CliqueMembership.DoesNotExist:
                return None
        return None

    def get_recent_posts(self, obj):
        """Get recent posts from the clique."""
        recent_posts = obj.posts.published()[:5]
        return PostListSerializer(recent_posts, many=True, context=self.context).data


class CliqueCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating cliques."""

    slug = serializers.CharField(read_only=True)

    class Meta:
        model = Clique
        fields = [
            "name",
            "slug",
            "description",
            "occupation",
            "privacy_level",
            "allow_posts",
            "allow_reviews",
        ]

    def create(self, validated_data):
        """Create a new clique."""
        validated_data["creator"] = self.context["request"].user
        validated_data["slug"] = slugify(validated_data["name"])
        clique = super().create(validated_data)

        # Add creator as admin member
        CliqueMembership.objects.create(
            user=clique.creator, clique=clique, role=CliqueMembership.Role.ADMIN
        )

        return clique

    def update(self, instance, validated_data):
        """Update a clique."""
        if "name" in validated_data:
            validated_data["slug"] = slugify(validated_data["name"])
        return super().update(instance, validated_data)


class CliqueMembershipSerializer(serializers.ModelSerializer):
    """Serializer for clique membership."""

    user = serializers.SerializerMethodField()
    clique_name = serializers.CharField(source="clique.name", read_only=True)

    class Meta:
        model = CliqueMembership
        fields = ["id", "user", "clique_name", "role", "joined_at", "is_active"]
        read_only_fields = ["id", "joined_at"]

    def get_user(self, obj):
        from apps.accounts.serializers import UserListSerializer

        return UserListSerializer(obj.user).data


class PostListSerializer(serializers.ModelSerializer):
    """Serializer for post list view."""

    author = serializers.SerializerMethodField()
    clique_name = serializers.CharField(source="clique.name", read_only=True)
    like_count = serializers.ReadOnlyField()
    comment_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "content",
            "caption",
            "author",
            "clique_name",
            "image",
            "like_count",
            "comment_count",
            "is_liked",
            "is_pinned",
            "created_at",
        ]

    def get_author(self, obj):
        from apps.accounts.serializers import UserListSerializer

        return UserListSerializer(obj.author).data

    def get_is_liked(self, obj):
        """Check if the current user has liked this post."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False


class PostDetailSerializer(serializers.ModelSerializer):
    """Serializer for post detail view."""

    author = serializers.SerializerMethodField()
    clique = CliqueListSerializer(read_only=True)
    like_count = serializers.ReadOnlyField()
    comment_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "content",
            "caption",
            "author",
            "clique",
            "image",
            "like_count",
            "comment_count",
            "is_liked",
            "comments",
            "is_pinned",
            "created_at",
            "updated_at",
        ]

    def get_author(self, obj):
        from apps.accounts.serializers import UserListSerializer

        return UserListSerializer(obj.author).data

    def get_is_liked(self, obj):
        """Check if the current user has liked this post."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_comments(self, obj):
        """Get top-level comments for this post."""
        comments = obj.comments.filter(parent=None, is_active=True)[:10]
        return CommentSerializer(comments, many=True, context=self.context).data


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating posts."""

    class Meta:
        model = Post
        fields = ["content", "caption", "clique", "image"]

    def create(self, validated_data):
        """Create a new post."""
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)

    def validate_clique(self, value):
        """Validate that the user can post to this clique."""
        user = self.context["request"].user

        # Check if user is a member of the clique
        if not value.members.filter(id=user.id).exists():
            raise serializers.ValidationError(
                "You must be a member to post to this clique."
            )

        # Check if the clique allows posts
        if not value.allow_posts:
            raise serializers.ValidationError("Posts are not allowed in this clique.")

        return value


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments."""

    author = serializers.SerializerMethodField()
    like_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "body",
            "author",
            "parent",
            "like_count",
            "is_liked",
            "replies",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_author(self, obj):
        from apps.accounts.serializers import UserListSerializer

        return UserListSerializer(obj.author).data

    def get_is_liked(self, obj):
        """Check if the current user has liked this comment."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_replies(self, obj):
        """Get replies to this comment."""
        if obj.parent is None:  # Only show replies for top-level comments
            replies = obj.replies.filter(is_active=True)[:5]
            return CommentSerializer(replies, many=True, context=self.context).data
        return []


class CommentCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating comments."""

    class Meta:
        model = Comment
        fields = ["body", "post", "parent"]

    def create(self, validated_data):
        """Create a new comment."""
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)

    def validate(self, attrs):
        """Validate comment data."""
        post = attrs.get("post")
        parent = attrs.get("parent")

        # If replying to a comment, ensure it belongs to the same post
        if parent and parent.post != post:
            raise serializers.ValidationError(
                "Parent comment must belong to the same post."
            )

        return attrs


class FollowSerializer(serializers.ModelSerializer):
    """Serializer for follow relationships."""

    follower = serializers.SerializerMethodField()
    followed = serializers.SerializerMethodField()
    followed_username = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Follow
        fields = ["id", "follower", "followed", "followed_username", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_follower(self, obj):
        from apps.accounts.serializers import UserListSerializer

        return UserListSerializer(obj.follower).data

    def get_followed(self, obj):
        from apps.accounts.serializers import UserListSerializer

        return UserListSerializer(obj.followed).data

    def create(self, validated_data):
        """Create a follow relationship."""
        followed_username = validated_data.pop("followed_username", None)

        if followed_username:
            from apps.accounts.models import User

            try:
                followed_user = User.objects.get(username=followed_username)
                validated_data["followed"] = followed_user
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"followed_username": "User not found."}
                )

        validated_data["follower"] = self.context["request"].user

        # Check if user is trying to follow themselves
        if validated_data["follower"] == validated_data["followed"]:
            raise serializers.ValidationError("You cannot follow yourself.")

        return super().create(validated_data)


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for reviews."""

    author = serializers.SerializerMethodField()
    clique_name = serializers.CharField(source="clique.name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "body",
            "rating",
            "author",
            "clique_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_author(self, obj):
        from apps.accounts.serializers import UserListSerializer

        return UserListSerializer(obj.author).data


class ReviewCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating reviews."""

    class Meta:
        model = Review
        fields = ["body", "rating", "clique"]

    def create(self, validated_data):
        """Create a new review."""
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)

    def validate_clique(self, value):
        """Validate that the user can review this clique."""
        user = self.context["request"].user

        # Check if the clique allows reviews
        if not value.allow_reviews:
            raise serializers.ValidationError(
                "Reviews are not allowed for this clique."
            )

        # Check if user has already reviewed this clique (for create only)
        if (
            not self.instance
            and Review.objects.filter(author=user, clique=value).exists()
        ):
            raise serializers.ValidationError("You have already reviewed this clique.")

        return value
