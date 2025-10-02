"""
Signals for the social app.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Follow, Post, Comment


@receiver(post_save, sender=Follow)
def follow_created(sender, instance, created, **kwargs):
    """Handle follow creation."""
    if created:
        # You could send notifications here
        pass


@receiver(post_delete, sender=Follow)
def follow_deleted(sender, instance, **kwargs):
    """Handle follow deletion."""
    # You could send notifications here
    pass


@receiver(post_save, sender=Post)
def post_created(sender, instance, created, **kwargs):
    """Handle post creation."""
    if created:
        # You could send notifications to clique members here
        pass


@receiver(post_save, sender=Comment)
def comment_created(sender, instance, created, **kwargs):
    """Handle comment creation."""
    if created:
        # You could send notifications to post author here
        pass
