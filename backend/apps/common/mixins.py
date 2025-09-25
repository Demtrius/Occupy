"""
Common mixins for views and models.
"""

from django.utils import timezone
from django.db import models
from rest_framework.response import Response
from rest_framework import status


class TimestampMixin(models.Model):
    """
    Abstract model mixin that adds created_at and updated_at timestamps.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SoftDeleteMixin(models.Model):
    """
    Abstract model mixin that adds soft delete functionality.
    """

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        """Mark the object as deleted."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restore a soft-deleted object."""
        self.is_deleted = False
        self.deleted_at = None
        self.save()


class ActiveManager(models.Manager):
    """Manager that excludes soft-deleted objects."""

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


class AllObjectsManager(models.Manager):
    """Manager that includes all objects, including soft-deleted ones."""

    def get_queryset(self):
        return super().get_queryset()


class SoftDeleteModel(SoftDeleteMixin, TimestampMixin):
    """
    Abstract model that combines soft delete and timestamp functionality.
    """

    objects = ActiveManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True


class ResponseMixin:
    """
    Mixin for API views to provide consistent response formatting.
    """

    def success_response(
        self, data=None, message="Success", status_code=status.HTTP_200_OK
    ):
        """Return a standardized success response."""
        response_data = {
            "success": True,
            "message": message,
        }

        if data is not None:
            response_data["data"] = data

        return Response(response_data, status=status_code)

    def error_response(
        self,
        message="An error occurred",
        errors=None,
        status_code=status.HTTP_400_BAD_REQUEST,
    ):
        """Return a standardized error response."""
        response_data = {
            "success": False,
            "message": message,
        }

        if errors:
            response_data["errors"] = errors

        return Response(response_data, status=status_code)

    def validation_error_response(self, serializer):
        """Return a standardized validation error response."""
        return self.error_response(
            message="Validation failed",
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST,
        )


class PaginationMixin:
    """
    Mixin for views that need pagination.
    """

    def get_paginated_response_data(self, paginated_data):
        """Return paginated response data."""
        return {
            "results": paginated_data["items"],
            "pagination": {
                "page": paginated_data["page"],
                "pages": paginated_data["pages"],
                "per_page": paginated_data["per_page"],
                "total": paginated_data["total"],
                "has_next": paginated_data["has_next"],
                "has_previous": paginated_data["has_previous"],
                "next_page": paginated_data["next_page"],
                "previous_page": paginated_data["previous_page"],
            },
        }


class CacheKeyMixin:
    """
    Mixin for generating cache keys.
    """

    def get_cache_key(self, prefix, *args):
        """Generate a cache key with the given prefix and arguments."""
        key_parts = [str(prefix)]
        key_parts.extend([str(arg) for arg in args])
        return ":".join(key_parts)

    def get_user_cache_key(self, user_id, suffix=""):
        """Generate a cache key for a specific user."""
        key = f"user:{user_id}"
        if suffix:
            key = f"{key}:{suffix}"
        return key

    def get_object_cache_key(self, model_name, object_id, suffix=""):
        """Generate a cache key for a specific object."""
        key = f"{model_name}:{object_id}"
        if suffix:
            key = f"{key}:{suffix}"
        return key


class LoggingMixin:
    """
    Mixin for adding logging functionality to views.
    """

    def log_action(self, action, user=None, extra_data=None):
        """Log an action with optional user and extra data."""
        import logging

        logger = logging.getLogger("apps")

        log_data = {
            "action": action,
            "view": self.__class__.__name__,
        }

        if user:
            log_data["user"] = str(user)

        if extra_data:
            log_data.update(extra_data)

        logger.info(f"Action logged: {log_data}")


class PermissionMixin:
    """
    Mixin for handling common permission checks.
    """

    def check_object_permissions(self, request, obj):
        """
        Check if the user has permission to access the object.
        Override this method in your views.
        """
        return True

    def check_ownership(self, request, obj, owner_field="user"):
        """Check if the user owns the object."""
        owner = getattr(obj, owner_field, None)
        return owner == request.user

    def check_membership(self, request, obj, membership_field="members"):
        """Check if the user is a member of the object."""
        members = getattr(obj, membership_field, None)
        if members:
            return members.filter(id=request.user.id).exists()
        return False
