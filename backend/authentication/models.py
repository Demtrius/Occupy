from django.db import models
from django.utils import timezone


class BlacklistedToken(models.Model):
    """
    Model to store blacklisted JWT tokens.
    """
    token = models.TextField(unique=True, help_text="The blacklisted JWT token")
    blacklisted_at = models.DateTimeField(default=timezone.now, help_text="When the token was blacklisted")
    expires_at = models.DateTimeField(help_text="When the token would have expired")

    class Meta:
        verbose_name = "Blacklisted Token"
        verbose_name_plural = "Blacklisted Tokens"
        indexes = [
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"Blacklisted token ending in ...{self.token[-10:]}"

    @classmethod
    def is_blacklisted(cls, token):
        """Check if a token is blacklisted."""
        return cls.objects.filter(token=token).exists()

    @classmethod
    def blacklist_token(cls, token, expires_at):
        """Blacklist a token if not already blacklisted."""
        if not cls.is_blacklisted(token):
            cls.objects.create(token=token, expires_at=expires_at)
