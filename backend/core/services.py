"""
Services for core app business logic.
"""

from typing import List, Optional, Dict, Any
from django.db import transaction
from django.core.exceptions import ValidationError

from .models import Post, CommentPost, Like, Clique, Service, Booking
from users.models import Occupier


# Post services
@transaction.atomic
def post_create(*, occupier: Occupier, clique: Clique, content: str, caption: str, status: str = "posted") -> Post:
    """Create a new post."""
    post = Post(
        occupier=occupier,
        clique=clique,
        content=content,
        caption=caption,
        status=status
    )
    post.full_clean()
    post.save()
    return post


@transaction.atomic
def post_update(*, post: Post, **fields) -> Post:
    """Update a post."""
    for field, value in fields.items():
        if hasattr(post, field):
            setattr(post, field, value)
    post.full_clean()
    post.save()
    return post


@transaction.atomic
def post_delete(*, post: Post) -> None:
    """Delete a post."""
    post.delete()


# Comment services
@transaction.atomic
def comment_create(*, post: Post, occupier: Occupier, body: str) -> CommentPost:
    """Create a new comment on a post."""
    comment = CommentPost(
        post=post,
        occupier=occupier,
        body=body
    )
    comment.full_clean()
    comment.save()
    return comment


@transaction.atomic
def comment_update(*, comment: CommentPost, body: str) -> CommentPost:
    """Update a comment."""
    comment.body = body
    comment.full_clean()
    comment.save()
    return comment


@transaction.atomic
def comment_delete(*, comment: CommentPost) -> None:
    """Delete a comment."""
    comment.delete()


# Like services
@transaction.atomic
def like_create(*, post: Post, user: Occupier) -> Like:
    """Create a like on a post."""
    # Check if already liked
    if Like.objects.filter(post=post, user=user).exists():
        raise ValidationError("Post already liked by this user")

    like = Like(post=post, user=user)
    like.full_clean()
    like.save()
    return like


@transaction.atomic
def like_delete(*, post: Post, user: Occupier) -> None:
    """Remove a like from a post."""
    Like.objects.filter(post=post, user=user).delete()


# Clique services
@transaction.atomic
def clique_create(*, name: str, description: str, occupier: Occupier, **kwargs) -> Clique:
    """Create a new clique."""
    clique = Clique(
        name=name,
        description=description,
        occupier=occupier,
        **kwargs
    )
    clique.full_clean()
    clique.save()
    return clique


@transaction.atomic
def clique_update(*, clique: Clique, **fields) -> Clique:
    """Update a clique."""
    for field, value in fields.items():
        if hasattr(clique, field):
            setattr(clique, field, value)
    clique.full_clean()
    clique.save()
    return clique


@transaction.atomic
def clique_delete(*, clique: Clique) -> None:
    """Delete a clique."""
    clique.delete()


# Service services
@transaction.atomic
def service_create(*, provider: Occupier, clique: Clique, **fields) -> Service:
    """Create a new service."""
    service = Service(
        provider=provider,
        clique=clique,
        **fields
    )
    service.full_clean()
    service.save()
    return service


@transaction.atomic
def service_update(*, service: Service, data: Dict[str, Any]) -> Service:
    """Update a service."""
    for field, value in data.items():
        if hasattr(service, field):
            setattr(service, field, value)
    service.full_clean()
    service.save()
    return service


# Booking services
@transaction.atomic
def booking_create(*, client: Occupier, service: Service, **fields) -> Booking:
    """Create a new booking."""
    booking = Booking(
        client=client,
        service=service,
        clique=service.clique,
        provider=service.provider,
        **fields
    )
    booking.full_clean()
    booking.save()
    return booking


@transaction.atomic
def booking_update(*, booking: Booking, data: Dict[str, Any]) -> Booking:
    """Update a booking."""
    for field, value in data.items():
        if hasattr(booking, field):
            setattr(booking, field, value)
    booking.full_clean()
    booking.save()
    return booking


@transaction.atomic
def booking_confirm(*, booking: Booking, user: Occupier) -> Booking:
    """Confirm a booking."""
    if booking.provider != user:
        raise ValidationError("Only the service provider can confirm this booking.")
    if booking.status != "pending":
        raise ValidationError("Booking cannot be confirmed unless it is pending.")
    booking.status = "confirmed"
    booking.full_clean()
    booking.save()
    return booking


@transaction.atomic
def booking_cancel(*, booking: Booking, user: Occupier, reason: str = "") -> Booking:
    """Cancel a booking."""
    if booking.client != user and booking.provider != user:
        raise ValidationError("Only the client or provider can cancel this booking.")
    if booking.status == "cancelled":
        raise ValidationError("Booking is already cancelled.")
    booking.status = "cancelled"
    booking.cancellation_reason = reason
    booking.full_clean()
    booking.save()
    return booking


@transaction.atomic
def booking_complete(*, booking: Booking, user: Occupier) -> Booking:
    """Mark a booking as complete."""
    if booking.provider != user:
        raise ValidationError("Only the service provider can mark this booking as complete.")
    if booking.status != "confirmed":
        raise ValidationError("Booking cannot be completed unless it is confirmed.")
    booking.status = "completed"
    booking.full_clean()
    booking.save()
    return booking