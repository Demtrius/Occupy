from django.contrib import admin
from .models import (
    Like,
    CommentPost,
    Review,
    Post,
    Clique,
    Service,
    Availability,
    Booking,
)


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    """Admin interface for Like model."""

    list_display = ["id", "user", "post", "created"]
    list_filter = ["created"]
    search_fields = ["user__username", "post__caption"]
    readonly_fields = ["created"]
    raw_id_fields = ["user", "post"]


@admin.register(CommentPost)
class CommentPostAdmin(admin.ModelAdmin):
    """Admin interface for CommentPost model."""

    list_display = ["id", "occupier", "post", "body_preview", "created"]
    list_filter = ["created"]
    search_fields = ["occupier__username", "body", "post__caption"]
    readonly_fields = ["created"]
    raw_id_fields = ["occupier", "post"]

    def body_preview(self, obj):
        """Return preview of comment body."""
        return obj.body[:50] + "..." if len(obj.body) > 50 else obj.body

    body_preview.short_description = "Comment"


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin interface for Review model."""

    list_display = ["id", "user", "clique", "booking", "rating", "created"]
    list_filter = ["rating", "created"]
    search_fields = ["user__username", "clique__name", "comment"]
    readonly_fields = ["created", "modified"]
    raw_id_fields = ["user", "clique", "booking"]


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """Admin interface for Post model."""

    list_display = ["id", "caption", "occupier", "clique", "created"]
    list_filter = ["created"]
    search_fields = ["caption", "content", "occupier__username"]
    readonly_fields = ["created", "modified"]


@admin.register(Clique)
class CliqueAdmin(admin.ModelAdmin):
    """Admin interface for Clique model."""

    list_display = ["id", "name", "occupier", "level", "created"]
    list_filter = ["level", "created"]
    search_fields = ["name", "description", "occupation"]
    readonly_fields = ["created"]


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """Admin interface for Service model."""

    list_display = [
        "id",
        "title",
        "clique",
        "provider",
        "price",
        "duration_minutes",
        "is_active",
    ]
    list_filter = ["is_active", "created"]
    search_fields = ["title", "description", "clique__name"]
    readonly_fields = ["created", "modified"]


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    """Admin interface for Availability model."""

    list_display = [
        "id",
        "clique",
        "provider",
        "date",
        "start_time",
        "end_time",
        "is_recurring",
    ]
    list_filter = ["is_recurring", "day_of_week"]
    search_fields = ["clique__name", "provider__username"]


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """Admin interface for Booking model."""

    list_display = [
        "id",
        "service",
        "client",
        "provider",
        "date",
        "status",
        "created",
    ]
    list_filter = ["status", "date", "created"]
    search_fields = ["client__username", "provider__username", "service__title"]
    readonly_fields = ["created", "modified"]
