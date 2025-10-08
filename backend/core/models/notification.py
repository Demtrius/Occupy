from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model
from .base import SoftDeleteModel


class Notification(SoftDeleteModel):
    """
    Notification model represents system notifications for users.

    Notifications can be for various events like likes, comments, follows, etc.
    They can be marked as read/unread and have different types.
    """

    class NotificationType(models.TextChoices):
        LIKE = "LIKE", "Like"
        COMMENT = "COMMENT", "Comment"
        FOLLOW = "FOLLOW", "Follow"
        BOOKING_REQUEST = "BOOKING_REQUEST", "Booking Request"
        BOOKING_CONFIRMED = "BOOKING_CONFIRMED", "Booking Confirmed"
        BOOKING_CANCELLED = "BOOKING_CANCELLED", "Booking Cancelled"
        REVIEW = "REVIEW", "Review"
        SYSTEM = "SYSTEM", "System"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        help_text="User who receives the notification"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_notifications",
        null=True,
        blank=True,
        help_text="User who triggered the notification (null for system notifications)"
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        help_text="Type of notification"
    )
    title = models.CharField(
        max_length=200,
        help_text="Notification title"
    )
    message = models.TextField(
        max_length=500,
        help_text="Notification message content"
    )
    is_read = models.BooleanField(
        default=False,
        help_text="Whether the notification has been read"
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the notification was read"
    )

    # Related object IDs for linking to specific content
    post_id = models.BigIntegerField(
        null=True,
        blank=True,
        help_text="Related post ID (for likes, comments)"
    )
    comment_id = models.BigIntegerField(
        null=True,
        blank=True,
        help_text="Related comment ID"
    )
    booking_id = models.BigIntegerField(
        null=True,
        blank=True,
        help_text="Related booking ID"
    )
    clique_id = models.BigIntegerField(
        null=True,
        blank=True,
        help_text="Related clique ID"
    )

    class Meta(SoftDeleteModel.Meta):
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created"]

    def __str__(self) -> str:
        """Return string representation of the notification."""
        return f"Notification for {self.recipient.username}: {self.title}"

    def __repr__(self) -> str:
        """Return detailed string representation of the notification."""
        return f"<Notification: {self.id} for {self.recipient.username} - {self.notification_type}>"


class NotificationSettings(SoftDeleteModel):
    """
    NotificationSettings model controls user notification preferences.

    Users can customize which types of notifications they want to receive.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_settings",
        help_text="User these settings belong to"
    )

    # Email notification preferences
    email_likes = models.BooleanField(
        default=True,
        help_text="Receive email notifications for likes"
    )
    email_comments = models.BooleanField(
        default=True,
        help_text="Receive email notifications for comments"
    )
    email_follows = models.BooleanField(
        default=True,
        help_text="Receive email notifications for new followers"
    )
    email_bookings = models.BooleanField(
        default=True,
        help_text="Receive email notifications for booking updates"
    )
    email_reviews = models.BooleanField(
        default=True,
        help_text="Receive email notifications for reviews"
    )
    email_system = models.BooleanField(
        default=True,
        help_text="Receive email notifications for system messages"
    )

    # Push notification preferences
    push_likes = models.BooleanField(
        default=True,
        help_text="Receive push notifications for likes"
    )
    push_comments = models.BooleanField(
        default=True,
        help_text="Receive push notifications for comments"
    )
    push_follows = models.BooleanField(
        default=True,
        help_text="Receive push notifications for new followers"
    )
    push_bookings = models.BooleanField(
        default=True,
        help_text="Receive push notifications for booking updates"
    )
    push_reviews = models.BooleanField(
        default=True,
        help_text="Receive push notifications for reviews"
    )
    push_system = models.BooleanField(
        default=True,
        help_text="Receive push notifications for system messages"
    )

    class Meta(SoftDeleteModel.Meta):
        verbose_name = "Notification Settings"
        verbose_name_plural = "Notification Settings"

    def __str__(self) -> str:
        """Return string representation of the notification settings."""
        return f"Notification settings for {self.user.username}"

    def __repr__(self) -> str:
        """Return detailed string representation of the notification settings."""
        return f"<NotificationSettings: {self.user.username}>"