"""
Service-related models for the core app.
"""

from django.db import models

from .base import SoftDeleteModel


class Service(SoftDeleteModel):
    """
    Model for services offered by cliques.

    Services are offerings by business cliques that can be booked by users.
    """

    clique = models.ForeignKey(
        "Clique",
        on_delete=models.CASCADE,
        related_name="services",
        help_text="Clique offering this service",
    )
    provider = models.ForeignKey(
        "users.Occupier",
        on_delete=models.CASCADE,
        related_name="services",
        help_text="User providing this service",
    )
    title = models.CharField(
        max_length=200,
        help_text="Title of the service",
    )
    description = models.TextField(
        help_text="Detailed description of the service",
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price of the service",
    )
    duration_minutes = models.PositiveIntegerField(
        help_text="Duration of the service in minutes",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this service is currently available",
    )

    class Meta(SoftDeleteModel.Meta):
        verbose_name = "Service"
        verbose_name_plural = "Services"

    def __str__(self) -> str:
        return f"{self.title} by {self.clique.name}"


class Availability(SoftDeleteModel):
    """
    Model for service provider availability.

    Defines when a provider is available for bookings.
    """

    DAYS_OF_WEEK = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    clique = models.ForeignKey(
        "Clique",
        on_delete=models.CASCADE,
        related_name="availabilities",
        help_text="Clique this availability belongs to",
    )
    provider = models.ForeignKey(
        "users.Occupier",
        on_delete=models.CASCADE,
        related_name="availabilities",
        help_text="User this availability is for",
    )
    date = models.DateField(
        null=True,
        blank=True,
        help_text="Specific date for one-time availability",
    )
    start_time = models.TimeField(
        help_text="Start time of availability",
    )
    end_time = models.TimeField(
        help_text="End time of availability",
    )
    is_recurring = models.BooleanField(
        default=False,
        help_text="Whether this is a recurring weekly availability",
    )
    day_of_week = models.PositiveSmallIntegerField(
        choices=DAYS_OF_WEEK,
        null=True,
        blank=True,
        help_text="Day of week for recurring availability",
    )

    class Meta:
        ordering = ["date", "start_time"]
        verbose_name = "Availability"
        verbose_name_plural = "Availabilities"
        unique_together = ["provider", "date", "start_time", "end_time"]

    def __str__(self) -> str:
        if self.is_recurring:
            return f"{self.provider.username} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"
        else:
            return f"{self.provider.username} - {self.date} {self.start_time}-{self.end_time}"


class Booking(SoftDeleteModel):
    """
    Model for service bookings.

    Bookings are made by clients for services offered by providers.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="bookings",
        help_text="Service being booked",
    )
    clique = models.ForeignKey(
        "Clique",
        on_delete=models.CASCADE,
        related_name="bookings",
        help_text="Clique the booking belongs to",
    )
    client = models.ForeignKey(
        "users.Occupier",
        on_delete=models.CASCADE,
        related_name="client_bookings",
        help_text="User booking the service",
    )
    provider = models.ForeignKey(
        "users.Occupier",
        on_delete=models.CASCADE,
        related_name="provider_bookings",
        help_text="User providing the service",
    )
    date = models.DateField(
        help_text="Date of the booking",
    )
    start_time = models.TimeField(
        help_text="Start time of the booking",
    )
    end_time = models.TimeField(
        help_text="End time of the booking",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        help_text="Current status of the booking",
    )
    notes = models.TextField(
        blank=True,
        help_text="Additional notes for the booking",
    )
    cancellation_reason = models.TextField(
        blank=True,
        help_text="Reason for cancellation if applicable",
    )

    class Meta(SoftDeleteModel.Meta):
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        unique_together = ["service", "date", "start_time"]

    def __str__(self) -> str:
        return f"{self.client.username} booked {self.service.title} on {self.date}"