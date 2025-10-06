"""
User Admin Configuration

This module configures the Django admin interface for the Occupier (user) model.
Includes comprehensive type annotations, custom displays, filters, and actions.
"""

from typing import Any, List, Optional, Tuple, Union
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.core.handlers.wsgi import WSGIRequest
from django.db.models import QuerySet
from django.forms import ModelForm, CharField, ValidationError
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import Occupier


class OccupierCreationForm(ModelForm):
    """
    Form for creating new users in the admin interface.

    Includes all required fields and password confirmation.
    """

    password1 = CharField(
        label="Password",
        widget=admin.widgets.AdminTextInputWidget(attrs={"type": "password"}),
        help_text="Enter a strong password",
    )
    password2 = CharField(
        label="Password confirmation",
        widget=admin.widgets.AdminTextInputWidget(attrs={"type": "password"}),
        help_text="Enter the same password again for verification",
    )

    class Meta:
        model = Occupier
        fields = ("email", "username", "occupations")

    def clean_password2(self) -> str:
        """
        Validate that the two password entries match.

        Returns:
            str: The validated password

        Raises:
            ValidationError: If passwords don't match
        """
        password1: Optional[str] = self.cleaned_data.get("password1")
        password2: Optional[str] = self.cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            raise ValidationError("Passwords don't match")
        return password2

    def save(self, commit: bool = True) -> Occupier:
        """
        Save the user with hashed password.

        Args:
            commit: Whether to save to database immediately

        Returns:
            Occupier: The created user instance
        """
        user: Occupier = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class OccupierChangeForm(ModelForm):
    """
    Form for updating users in the admin interface.

    Password field shows a read-only hash with a link to change it.
    """

    password = ReadOnlyPasswordHashField(
        label="Password",
        help_text=_(
            "Raw passwords are not stored, so there is no way to see this "
            "user's password, but you can change the password using "
            '<a href="../password/">this form</a>.'
        ),
    )

    class Meta:
        model = Occupier
        fields = (
            "email",
            "username",
            "password",
            "occupations",
            "first_name",
            "last_name",
            "is_active",
            "is_admin",
            "is_staff",
            "is_superuser",
            "is_business_page",
            "private_account",
        )


@admin.register(Occupier)
class OccupierAdmin(BaseUserAdmin):
    """
    Admin interface configuration for Occupier model.

    Provides comprehensive management interface with proper organization,
    filters, search capabilities, and custom actions.
    """

    # Forms to use for creating and editing users
    form = OccupierChangeForm
    add_form = OccupierCreationForm

    # Fields to display in the list view
    list_display: Tuple[str, ...] = (
        "username",
        "email",
        "occupations",
        "colored_account_type",
        "is_active",
        "is_staff",
        "date_joined",
    )

    # Fields that are links to the detail page
    list_display_links: Tuple[str, ...] = ("username", "email")

    # Filters in the right sidebar
    list_filter: Tuple[str, ...] = (
        "is_staff",
        "is_superuser",
        "is_active",
        "is_business_page",
        "private_account",
        "date_joined",
    )

    # Fields to search
    search_fields: Tuple[str, ...] = (
        "username",
        "email",
        "first_name",
        "last_name",
        "occupations",
    )

    # Default ordering
    ordering: Tuple[str, ...] = ("-date_joined",)

    # Number of items per page
    list_per_page: int = 25

    # Fields that can be edited directly in the list view
    list_editable: Tuple[str, ...] = ("is_active",)

    # Fieldsets for the detail/edit view
    fieldsets: Tuple[Tuple[Optional[str], dict], ...] = (
        (
            None,
            {
                "fields": ("username", "email", "password"),
                "description": "Core authentication credentials",
            },
        ),
        (
            "Personal Information",
            {
                "fields": ("first_name", "last_name", "occupations"),
                "classes": ("collapse",),
            },
        ),
        (
            "Account Type",
            {
                "fields": ("is_business_page", "private_account"),
                "description": "Configure account type and privacy settings",
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_admin",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Important Dates",
            {
                "fields": ("last_login", "date_joined"),
                "classes": ("collapse",),
            },
        ),
    )

    # Fieldsets for the add user view
    add_fieldsets: Tuple[Tuple[Optional[str], dict], ...] = (
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
                "description": "Create a new user account",
            },
        ),
        (
            "Account Type (Optional)",
            {
                "classes": ("collapse",),
                "fields": ("is_business_page", "private_account"),
            },
        ),
        (
            "Permissions (Optional)",
            {
                "classes": ("collapse",),
                "fields": ("is_staff", "is_admin", "is_superuser"),
            },
        ),
    )

    # Read-only fields
    readonly_fields: Tuple[str, ...] = ("last_login", "date_joined")

    # Custom methods for list display
    @admin.display(description="Account Type", ordering="is_business_page")
    def colored_account_type(self, obj: Occupier) -> str:
        """
        Display account type with color coding.

        Args:
            obj: The Occupier instance

        Returns:
            str: HTML-formatted account type with color
        """
        if obj.is_superuser:
            color = "red"
            account_type = "Superuser"
        elif obj.is_business_page:
            color = "blue"
            account_type = "Business"
        elif obj.private_account:
            color = "orange"
            account_type = "Private"
        else:
            color = "green"
            account_type = "Regular"

        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            account_type,
        )

    # Custom admin actions
    @admin.action(description="Activate selected users")
    def activate_users(
        self, request: WSGIRequest, queryset: QuerySet[Occupier]
    ) -> None:
        """
        Activate selected user accounts.

        Args:
            request: The HTTP request
            queryset: Selected user queryset
        """
        updated: int = queryset.update(is_active=True)
        self.message_user(
            request,
            f"{updated} user(s) successfully activated.",
        )

    @admin.action(description="Deactivate selected users")
    def deactivate_users(
        self, request: WSGIRequest, queryset: QuerySet[Occupier]
    ) -> None:
        """
        Deactivate selected user accounts.

        Args:
            request: The HTTP request
            queryset: Selected user queryset
        """
        updated: int = queryset.update(is_active=False)
        self.message_user(
            request,
            f"{updated} user(s) successfully deactivated.",
        )

    @admin.action(description="Convert to business accounts")
    def convert_to_business(
        self, request: WSGIRequest, queryset: QuerySet[Occupier]
    ) -> None:
        """
        Convert selected accounts to business accounts.

        Args:
            request: The HTTP request
            queryset: Selected user queryset
        """
        updated: int = queryset.update(is_business_page=True)
        self.message_user(
            request,
            f"{updated} account(s) converted to business accounts.",
        )

    actions: List[str] = [
        "activate_users",
        "deactivate_users",
        "convert_to_business",
    ]

    def get_queryset(self, request: WSGIRequest) -> QuerySet[Occupier]:
        """
        Get the queryset for the admin list view.

        Args:
            request: The HTTP request

        Returns:
            QuerySet: Filtered queryset
        """
        qs: QuerySet[Occupier] = super().get_queryset(request)
        # Add any custom queryset modifications here
        return qs

    def has_delete_permission(
        self, request: WSGIRequest, obj: Optional[Occupier] = None
    ) -> bool:
        """
        Check if user has permission to delete.

        Args:
            request: The HTTP request
            obj: The object instance (if applicable)

        Returns:
            bool: True if user can delete, False otherwise
        """
        # Prevent deletion of superuser accounts unless requester is superuser
        if obj and obj.is_superuser and not request.user.is_superuser:
            return False
        return super().has_delete_permission(request, obj)

    def save_model(
        self,
        request: WSGIRequest,
        obj: Occupier,
        form: ModelForm,
        change: bool,
    ) -> None:
        """
        Save the model with custom logic.

        Args:
            request: The HTTP request
            obj: The object instance
            form: The form instance
            change: True if editing existing object, False if creating new
        """
        if not change:
            # New user - ensure password is set
            obj.set_password(form.cleaned_data["password1"])
        super().save_model(request, obj, form, change)


# Customize admin site header and title
admin.site.site_header = "Occupy Administration"
admin.site.site_title = "Occupy Admin"
admin.site.index_title = "Welcome to Occupy Administration"
