"""
Admin configuration for the social app.
"""

from django.contrib import admin
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


@admin.register(Clique)
class CliqueAdmin(admin.ModelAdmin):
    """Admin configuration for the Clique model."""

    list_display = [
        "name",
        "creator",
        "privacy_level",
        "occupation",
        "member_count",
        "is_active",
        "created_at",
    ]
    list_filter = [
        "privacy_level",
        "allow_posts",
        "allow_reviews",
        "is_active",
        "created_at",
    ]
    search_fields = ["name", "description", "occupation", "creator__username"]
    readonly_fields = ["id", "slug", "created_at", "updated_at"]
    prepopulated_fields = {"slug": ("name",)}

    fieldsets = (
        (None, {"fields": ("name", "slug", "description", "occupation")}),
        (
            "Settings",
            {"fields": ("privacy_level", "allow_posts", "allow_reviews", "is_active")},
        ),
        ("Ownership", {"fields": ("creator",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def member_count(self, obj):
        return obj.members.count()

    member_count.short_description = "Members"


@admin.register(CliqueMembership)
class CliqueMembershipAdmin(admin.ModelAdmin):
    """Admin configuration for the CliqueMembership model."""

    list_display = ["user", "clique", "role", "is_active", "joined_at"]
    list_filter = ["role", "is_active", "joined_at"]
    search_fields = ["user__username", "clique__name"]
    readonly_fields = ["joined_at"]


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """Admin configuration for the Post model."""

    list_display = [
        "author",
        "clique",
        "content_preview",
        "like_count",
        "is_published",
        "is_pinned",
        "created_at",
    ]
    list_filter = ["is_published", "is_pinned", "created_at", "clique"]
    search_fields = ["content", "caption", "author__username", "clique__name"]
    readonly_fields = ["id", "created_at", "updated_at"]

    fieldsets = (
        (None, {"fields": ("content", "caption", "image")}),
        ("Relationships", {"fields": ("author", "clique")}),
        ("Settings", {"fields": ("is_published", "is_pinned")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content

    content_preview.short_description = "Content"

    def like_count(self, obj):
        return obj.likes.count()

    like_count.short_description = "Likes"


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Admin configuration for the Comment model."""

    list_display = [
        "author",
        "post",
        "body_preview",
        "parent",
        "like_count",
        "is_active",
        "created_at",
    ]
    list_filter = ["is_active", "created_at"]
    search_fields = ["body", "author__username", "post__content"]
    readonly_fields = ["id", "created_at", "updated_at"]

    def body_preview(self, obj):
        return obj.body[:50] + "..." if len(obj.body) > 50 else obj.body

    body_preview.short_description = "Body"

    def like_count(self, obj):
        return obj.likes.count()

    like_count.short_description = "Likes"


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    """Admin configuration for the Follow model."""

    list_display = ["follower", "followed", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["follower__username", "followed__username"]
    readonly_fields = ["created_at"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """Admin configuration for the Review model."""

    list_display = [
        "author",
        "clique",
        "rating",
        "body_preview",
        "is_active",
        "created_at",
    ]
    list_filter = ["rating", "is_active", "created_at"]
    search_fields = ["body", "author__username", "clique__name"]
    readonly_fields = ["id", "created_at", "updated_at"]

    def body_preview(self, obj):
        return obj.body[:50] + "..." if len(obj.body) > 50 else obj.body

    body_preview.short_description = "Body"


# Register the through models for likes
admin.site.register(PostLike)
admin.site.register(CommentLike)
