from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model
from .base import SoftDeleteModel


class Message(SoftDeleteModel):
    """
    Message model represents direct messages between users.

    Messages are sent between users and can be part of conversations.
    They support text content and can be marked as read/unread.
    """

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
        help_text="User who sent the message"
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages",
        help_text="User who received the message"
    )
    content = models.TextField(
        max_length=1000,
        help_text="Message content"
    )
    is_read = models.BooleanField(
        default=False,
        help_text="Whether the message has been read by the recipient"
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when the message was read"
    )

    class Meta(SoftDeleteModel.Meta):
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ["created"]

    def __str__(self) -> str:
        """Return string representation of the message."""
        return f"Message from {self.sender.username} to {self.recipient.username}"

    def __repr__(self) -> str:
        """Return detailed string representation of the message."""
        return f"<Message: {self.id} from {self.sender.username} to {self.recipient.username}>"


class Conversation(SoftDeleteModel):
    """
    Conversation model groups messages between two users.

    Conversations help organize messages into threads between specific user pairs.
    """

    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="conversations",
        help_text="Users participating in this conversation"
    )
    last_message = models.ForeignKey(
        Message,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conversation_last",
        help_text="The most recent message in this conversation"
    )

    class Meta(SoftDeleteModel.Meta):
        verbose_name = "Conversation"
        verbose_name_plural = "Conversations"

    def __str__(self) -> str:
        """Return string representation of the conversation."""
        participant_names = [user.username for user in self.participants.all()]
        return f"Conversation between {', '.join(participant_names)}"

    def __repr__(self) -> str:
        """Return detailed string representation of the conversation."""
        return f"<Conversation: {self.id}>"