"""
Admin configuration for the accounts app.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, UserProfile, BlockedUser


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for the User model."""

    list_display = [
        "username",
        "email",
        "first_name",
        "last_name",
        "is_business_account",
        "is_active",
        "date_joined",
    ]
    list_filter = [
        "is_active",
        "is_staff",
        "is_superuser",
        "is_business_account",
        "is_private_account",
        "date_joined",
    ]
    search_fields = ["username", "email", "first_name", "last_name", "occupations"]
    ordering = ["-date_joined"]
    readonly_fields = ["id", "date_joined", "last_login", "updated_at"]

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            _("Personal info"),
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "email",
                    "occupations",
                    "date_of_birth",
                )
            },
        ),
        (_("Profile"), {"fields": ("bio", "location", "website", "avatar")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (
            _("Account Settings"),
            {"fields": ("is_business_account", "is_private_account")},
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "occupations",
                    "password1",
                    "password2",
                ),
            },
        ),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin configuration for the UserProfile model."""

    list_display = ["user", "phone_number", "show_email", "show_phone", "created_at"]
    list_filter = ["show_email", "show_phone", "show_location", "created_at"]
    search_fields = ["user__username", "user__email", "phone_number"]
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = (
        (_("Contact Information"), {"fields": ("phone_number", "address")}),
        (_("Social Media"), {"fields": ("social_media_links",)}),
        (
            _("Privacy Settings"),
            {"fields": ("show_email", "show_phone", "show_location")},
        ),
        (_("Preferences"), {"fields": ("preferences",)}),
        (_("Timestamps"), {"fields": ("created_at", "updated_at")}),
    )


@admin.register(BlockedUser)
class BlockedUserAdmin(admin.ModelAdmin):
    """Admin configuration for the BlockedUser model."""

    list_display = ["blocker", "blocked", "reason", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["blocker__username", "blocked__username", "reason"]
    readonly_fields = ["created_at"]

    fieldsets = (
        (None, {"fields": ("blocker", "blocked", "reason")}),
        (_("Timestamps"), {"fields": ("created_at",)}),
    )
