"""
Occupation Models

This module defines models for occupations and occupation categories.
These models provide a normalized way to store and categorize user professions.
"""

from django.db import models
from .base import SoftDeleteModel


class OccupationCategory(SoftDeleteModel):
    """
    OccupationCategory model represents broad categories of professions.

    Categories help organize occupations into logical groups (e.g., "Technology",
    "Healthcare", "Education", "Creative Arts", etc.).

    Attributes:
        name: The category name (e.g., "Technology", "Healthcare")
        description: Optional description of the category
        slug: URL-friendly identifier for the category
        is_active: Whether this category is currently active/available
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Category name (e.g., 'Technology', 'Healthcare')"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description of the occupation category"
    )
    slug = models.SlugField(
        max_length=120,
        unique=True,
        help_text="URL-friendly identifier for the category"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this category is currently active"
    )

    class Meta:
        verbose_name = "Occupation Category"
        verbose_name_plural = "Occupation Categories"
        ordering = ["name"]

    def __str__(self) -> str:
        """Return string representation of the category."""
        return self.name

    def __repr__(self) -> str:
        """Return detailed string representation of the category."""
        return f"<OccupationCategory: {self.name}>"


class Occupation(SoftDeleteModel):
    """
    Occupation model represents specific professions or job titles.

    Occupations are organized under categories and can be associated with
    users, cliques, and services.

    Attributes:
        name: The occupation name (e.g., "Software Developer", "Doctor")
        category: The category this occupation belongs to
        description: Optional description of the occupation
        slug: URL-friendly identifier for the occupation
        is_active: Whether this occupation is currently active/available
    """

    name = models.CharField(
        max_length=200,
        unique=True,
        help_text="Occupation name (e.g., 'Software Developer', 'Doctor')"
    )
    category = models.ForeignKey(
        OccupationCategory,
        on_delete=models.CASCADE,
        related_name="occupations",
        help_text="The category this occupation belongs to"
    )
    description = models.TextField(
        blank=True,
        help_text="Optional description of the occupation"
    )
    slug = models.SlugField(
        max_length=220,
        unique=True,
        help_text="URL-friendly identifier for the occupation"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this occupation is currently active"
    )

    class Meta:
        verbose_name = "Occupation"
        verbose_name_plural = "Occupations"
        ordering = ["category__name", "name"]

    def __str__(self) -> str:
        """Return string representation of the occupation."""
        return self.name

    def __repr__(self) -> str:
        """Return detailed string representation of the occupation."""
        return f"<Occupation: {self.name} ({self.category.name})>"