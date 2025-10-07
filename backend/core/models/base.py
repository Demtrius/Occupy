"""
Base Models

This module defines abstract base models that provide common functionality
across all models in the application. These include timestamp management and
soft delete capabilities, following the Django style guide.
"""

from django.db import models
from django.db.models import Manager, QuerySet
from django.utils import timezone


class BaseModel(models.Model):
    """
    Abstract base model that provides automatic timestamp fields.

    All models should inherit from this model. It provides `created` and
    `modified` fields that are automatically managed by Django.

    Attributes:
        created: Timestamp when the record was created.
        modified: Timestamp when the record was last updated.
    """

    created = models.DateTimeField(
        db_index=True,
        auto_now_add=True,
        help_text="Timestamp when the record was created.",
    )
    modified = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the record was last updated.",
    )

    class Meta:
        abstract = True
        ordering = ("-created",)


class SoftDeleteManager(Manager):
    """
    Custom manager for SoftDeleteModel that filters out soft-deleted objects.
    """

    def get_queryset(self) -> QuerySet:
        """Return a queryset that excludes soft-deleted objects."""
        return super().get_queryset().filter(is_deleted=False)


class SoftDeleteModel(BaseModel):
    """
    Abstract base model that provides soft delete functionality.

    Models inheriting from this will have soft delete capabilities,
    allowing records to be marked as deleted without actually removing them
    from the database.

    Attributes:
        is_deleted: Boolean flag indicating if the record is soft-deleted.
        deleted_at: Timestamp when the record was soft-deleted.
    """

    is_deleted = models.BooleanField(
        default=False,
        help_text="Soft delete flag - True if record is deleted.",
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the record was soft-deleted.",
    )

    objects = SoftDeleteManager()
    all_objects = Manager()  # Manager to access all objects, including deleted ones

    class Meta:
        abstract = True

    def soft_delete(self):
        """
        Soft delete the record.

        Marks the record as deleted and sets the deleted_at timestamp.
        """
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])

    def restore(self):
        """
        Restore a soft-deleted record.

        Resets the soft delete flags, making the record active again.
        """
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=["is_deleted", "deleted_at"])
