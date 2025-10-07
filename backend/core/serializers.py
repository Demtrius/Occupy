"""
Serializers for the core app (Posts and Cliques).
"""

from typing import Any, Dict
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Post,
    Clique,
    CliquePost,
    CommentPost,
    Like,
    Review,
    Service,
    Availability,
    Booking,
)

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

    occupier = UserBasicSerializer(read_only=True)
    clique = serializers.CharField(source="clique.name", read_only=True)
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
        return Like.objects.filter(post=obj).count()

    def get_comments_count(self, obj: Post) -> int:
        """Get the number of comments on this post."""
        return obj.comments.count() if hasattr(obj, "comments") else 0

    def get_is_liked(self, obj: Post) -> bool:
        """Check if the current user has liked this post."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Like.objects.filter(post=obj, user=request.user).exists()
        return False


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
        return Like.objects.filter(post=obj).count()

    def get_comments_count(self, obj: Post) -> int:
        """Get the count of comments on this post."""
        return obj.comments.count() if hasattr(obj, "comments") else 0

    def get_is_liked(self, obj: Post) -> bool:
        """Check if the current user has liked this post."""
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Like.objects.filter(post=obj, user=request.user).exists()
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


class ServiceListSerializer(serializers.ModelSerializer):
    """Serializer for listing services."""

    provider = UserBasicSerializer(read_only=True)
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
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "provider", "created_at", "updated_at"]

    def get_bookings_count(self, obj) -> int:
        """Get the count of bookings for this service."""
        return obj.bookings.count()


class ServiceDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for a single service."""

    provider = UserBasicSerializer(read_only=True)
    clique = CliqueListSerializer(read_only=True)
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
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "provider", "created_at", "updated_at"]

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
        from .models import Clique

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
        clique = Clique.objects.get(id=clique_id)

        # Provider and clique are set by the view
        service = Service.objects.create(clique=clique, **validated_data)
        return service


class AvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for availability slots."""

    provider = UserBasicSerializer(read_only=True)
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


class BookingListSerializer(serializers.ModelSerializer):
    """Serializer for listing bookings."""

    service = ServiceListSerializer(read_only=True)
    client = UserBasicSerializer(read_only=True)
    provider = UserBasicSerializer(read_only=True)
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
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "client",
            "provider",
            "created_at",
            "updated_at",
        ]


class BookingDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for a single booking."""

    service = ServiceDetailSerializer(read_only=True)
    client = UserBasicSerializer(read_only=True)
    provider = UserBasicSerializer(read_only=True)
    clique = CliqueListSerializer(read_only=True)

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
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "client",
            "provider",
            "created_at",
            "updated_at",
        ]


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
        from .models import Service

        try:
            service = Service.objects.get(id=value)
            if not service.is_active:
                raise serializers.ValidationError("This service is not available.")
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


class LikeSerializer(serializers.ModelSerializer):
    """Serializer for Like model."""

    user = UserBasicSerializer(read_only=True)

    class Meta:
        model = Like
        fields = ["id", "post", "user", "created_at"]
        read_only_fields = ["id", "user", "created_at"]


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for CommentPost model."""

    user = UserBasicSerializer(source="occupier", read_only=True)
    post_id = serializers.IntegerField(source="post.id", read_only=True)
    content = serializers.CharField(source="body")
    created_at = serializers.DateTimeField(source="date", read_only=True)

    class Meta:
        model = CommentPost
        fields = [
            "id",
            "post",
            "post_id",
            "user",
            "content",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]
        extra_kwargs = {
            "post": {"write_only": True},
        }

    def create(self, validated_data):
        """Create comment with the authenticated user."""
        validated_data["occupier"] = self.context["request"].user
        return super().create(validated_data)


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review model."""

    reviewer = UserBasicSerializer(source="user", read_only=True)
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
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "booking",
            "clique",
            "reviewer",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "booking": {"read_only": True},
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
