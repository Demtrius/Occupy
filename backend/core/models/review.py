"""
Review model for the core app.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

from .base import SoftDeleteModel


class Review(SoftDeleteModel):
    """
    Model for reviews of completed bookings.

    Reviews are left by clients after a booking is completed.
    """

    user = models.ForeignKey(
        "users.Occupier",
        on_delete=models.CASCADE,
        related_name="reviews",
        help_text="User who left the review",
    )
    booking = models.OneToOneField(
        "Booking",
        on_delete=models.CASCADE,
        related_name="review",
        help_text="Booking being reviewed",
    )
    clique = models.ForeignKey(
        "Clique",
        on_delete=models.CASCADE,
        related_name="reviews",
        help_text="Clique associated with the review",
    )
    rating = models.PositiveSmallIntegerField(
        help_text="Rating from 1 to 5",
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
    )
    comment = models.TextField(
        blank=True,
        help_text="Optional comment for the review",
    )

    class Meta(SoftDeleteModel.Meta):
        verbose_name = "Review"
        verbose_name_plural = "Reviews"

    def __str__(self) -> str:
        return f"Review by {self.user.username} for {self.booking} - {self.rating}/5"