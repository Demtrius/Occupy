"""
Filters for the social app.
"""

import django_filters
from .models import Clique, Post, Review


class CliqueFilter(django_filters.FilterSet):
    """Filter set for cliques."""

    name = django_filters.CharFilter(lookup_expr="icontains")
    occupation = django_filters.CharFilter(lookup_expr="icontains")
    privacy_level = django_filters.ChoiceFilter(choices=Clique.PrivacyLevel.choices)
    creator = django_filters.CharFilter(
        field_name="creator__username", lookup_expr="iexact"
    )
    created_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )

    class Meta:
        model = Clique
        fields = ["privacy_level", "allow_posts", "allow_reviews", "is_active"]


class PostFilter(django_filters.FilterSet):
    """Filter set for posts."""

    content = django_filters.CharFilter(lookup_expr="icontains")
    author = django_filters.CharFilter(
        field_name="author__username", lookup_expr="iexact"
    )
    clique = django_filters.CharFilter(
        field_name="clique__name", lookup_expr="icontains"
    )
    created_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )
    has_image = django_filters.BooleanFilter(
        field_name="image", lookup_expr="isnull", exclude=True
    )

    class Meta:
        model = Post
        fields = ["is_published", "is_pinned"]


class ReviewFilter(django_filters.FilterSet):
    """Filter set for reviews."""

    rating = django_filters.NumberFilter()
    rating_gte = django_filters.NumberFilter(field_name="rating", lookup_expr="gte")
    rating_lte = django_filters.NumberFilter(field_name="rating", lookup_expr="lte")
    author = django_filters.CharFilter(
        field_name="author__username", lookup_expr="iexact"
    )
    clique = django_filters.CharFilter(
        field_name="clique__name", lookup_expr="icontains"
    )
    created_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )

    class Meta:
        model = Review
        fields = ["rating", "is_active"]
