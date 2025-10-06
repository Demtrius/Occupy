"""
Core Models

This module defines the core models for the Occupy application including
Cliques, Posts, Comments, Reviews, Services, and Bookings.

All models include comprehensive type annotations for better code clarity and IDE support.
"""

from typing import Optional, Any
from django.db import models
from django.db.models import Manager, QuerySet
from users.models import Occupier
from django.utils import timezone


class Clique(models.Model):
    """
    Clique model represents a group or community that users can join.

    Cliques can be either public (anyone can join) or private (requires invitation).
    Each clique has an owner (occupier), members, and associated posts.

    Attributes:
        occupier: The creator/owner of the clique
        name: Unique name of the clique
        created_at: Timestamp when the clique was created
        description: Optional description of the clique
        members: Many-to-many relationship with Occupiers who are members
        level: Privacy level (PUBLIC or PRIVATE)
        occupation: The occupation category this clique is associated with
    """

    class CliqueObjects(Manager["Clique"]):
        """Custom manager that returns only public cliques by default."""

        def get_queryset(self) -> QuerySet["Clique"]:
            """Return queryset filtered to public cliques only."""
            return super().get_queryset().filter(level="public")

    class Type(models.TextChoices):
        PUBLIC = "PUBLIC"
        PRIVATE = "PRIVATE"

    occupier = models.ForeignKey(
        Occupier,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="cliques",
    )
    name = models.CharField(max_length=200, null=False, blank=False, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    description = models.CharField(blank=True, max_length=100)
    image = models.ImageField(upload_to="cliques/", blank=True, null=True)
    members = models.ManyToManyField(Occupier, blank=True)
    level = models.CharField(
        choices=Type.choices,
        max_length=15,
        default=Type.PUBLIC,
        help_text="""
        Public: Any user can join a public clique
        Private: Requires an invite to join clique
        """,
    )
    occupation = models.CharField(max_length=200, blank=False, null=False, default="")
    is_public = models.BooleanField(default=True)
    objects = models.Manager()  # default manager
    cliqueobjects = CliqueObjects()  # custom manager

    def __str__(self) -> str:
        """Return string representation of the clique."""
        return self.name

    def __repr__(self) -> str:
        """Return detailed string representation of the clique."""
        return f"<Clique: {self.name}>"

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Clique"
        verbose_name_plural = "Cliques"


class CliquePost(models.Model):
    """
    Junction table linking Cliques and Posts in a many-to-many relationship.

    This model allows posts to belong to multiple cliques and cliques to have
    multiple posts, while maintaining referential integrity.

    Attributes:
        clique: Reference to the Clique
        post: Reference to the Post
    """

    clique = models.ForeignKey(
        "Clique", related_name="posts_set", on_delete=models.CASCADE
    )
    post = models.ForeignKey(
        "Post", related_name="cliques_set", on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ["clique", "post"]
        verbose_name = "Clique Post"
        verbose_name_plural = "Clique Posts"

    def __str__(self) -> str:
        """Return string representation of the clique-post relationship."""
        return f"{self.clique.name} - {self.post.caption[:30]}"


class Follow(models.Model):
    """
    Follow model represents a follower-followed relationship between users.

    This model enables social networking features by tracking who follows whom.

    Attributes:
        follower: The user who is following
        followed: The user being followed
        created_at: Timestamp when the follow relationship was created
    """

    follower = models.ForeignKey(
        Occupier, related_name="following", on_delete=models.CASCADE, null=True
    )
    followed = models.ForeignKey(
        Occupier, related_name="followers", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("follower", "followed")
        verbose_name = "Follow"
        verbose_name_plural = "Follows"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        """Return string representation of the follow relationship."""
        return f"{self.follower} follows {self.followed}"

    def __repr__(self) -> str:
        """Return detailed string representation of the follow relationship."""
        return f"<Follow: {self.follower} -> {self.followed}>"


class Post(models.Model):
    """
    Post model represents user-generated content within cliques.

    Posts are the primary content type in the application, belonging to cliques
    and created by occupiers. They can have comments and be filtered by status.

    Attributes:
        clique: The clique this post belongs to
        content: Main text content of the post
        caption: Short caption/title for the post
        posted: Timestamp when the post was published
        occupier: The user who created the post
        timestamp: Timestamp when the post was created
    """

    class PostObjects(Manager["Post"]):
        """Custom manager that returns only posted content by default."""

        def get_queryset(self) -> QuerySet["Post"]:
            """Return queryset filtered to posted content only."""
            return super().get_queryset().filter(status="posted")

    clique = models.ForeignKey(
        Clique, on_delete=models.CASCADE, blank=False, related_name="posts"
    )
    content = models.TextField(max_length=400, null=False, blank=False)
    caption = models.CharField(max_length=400, null=False, blank=False)
    status = models.CharField(
        max_length=20,
        choices=[
            ("draft", "Draft"),
            ("posted", "Posted"),
            ("archived", "Archived"),
        ],
        default="posted",
    )
    posted = models.DateTimeField(default=timezone.now, blank=False)
    occupier = models.ForeignKey(
        Occupier,
        on_delete=models.CASCADE,
        related_name="posts",
        null=False,
        blank=True,
        default=1,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = models.Manager()  # default manager
    postobjects = PostObjects()  # custom manager

    def __str__(self) -> str:
        """Return string representation of the post."""
        return self.content[:50] if len(self.content) > 50 else self.content

    def __repr__(self) -> str:
        """Return detailed string representation of the post."""
        return f"<Post: {self.id} by {self.occupier.username}>"

    class Meta:
        ordering = ["-posted"]


class CommentPost(models.Model):
    """
    CommentPost model represents comments on posts.

    Users can comment on posts to engage in discussions. Comments are associated
    with both the post and the user who created them.

    Attributes:
        body: The text content of the comment
        occupier: The user who created the comment
        date: Timestamp when the comment was created
        post: The post this comment belongs to
    """

    body = models.TextField()
    occupier = models.ForeignKey(Occupier, on_delete=models.SET_NULL, null=True)
    date = models.DateTimeField(auto_now_add=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")

    class Meta:
        verbose_name = "Comment"
        verbose_name_plural = "Comments"
        ordering = ["-date"]

    def __str__(self) -> str:
        """Return string representation of the comment."""
        return f"Comment by {self.occupier.username if self.occupier else 'Unknown'} on {self.post.caption}"

    def __repr__(self) -> str:
        """Return detailed string representation of the comment."""
        return f"<CommentPost: {self.id} on Post {self.post.id}>"


class Review(models.Model):
    """
    Review model represents user reviews of cliques.

    Users can leave reviews and feedback on cliques they are part of or have
    interacted with.

    Attributes:
        body: The text content of the review
        user: The user who created the review
        created_at: Timestamp when the review was created
        clique: The clique being reviewed
    """

    body = models.TextField()
    user = models.ForeignKey(Occupier, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    clique = models.ForeignKey(Clique, on_delete=models.CASCADE, related_name="reviews")

    class Meta:
        verbose_name = "Review"
        verbose_name_plural = "Reviews"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        """Return string representation of the review."""
        username = self.user.username if self.user else "Unknown"
        return f"{username} - {self.body[:20]}"

    def __repr__(self) -> str:
        """Return detailed string representation of the review."""
        return f"<Review: {self.id} on Clique {self.clique.name}>"


class Service(models.Model):
    """
    Service model represents services offered by occupiers.

    Business pages and users can offer services to other users. Services have
    pricing, duration, and availability information.

    Attributes:
        provider: The occupier offering this service
        title: Name/title of the service
        price: Cost of the service (optional)
        duration_minutes: Expected duration of the service in minutes
    """

    provider = models.ForeignKey(
        Occupier, on_delete=models.CASCADE, related_name="services"
    )
    title = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=60)

    class Meta:
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ["title"]

    def __str__(self) -> str:
        """Return string representation of the service."""
        return f"{self.title} by {self.provider.username}"

    def __repr__(self) -> str:
        """Return detailed string representation of the service."""
        return f"<Service: {self.id} - {self.title}>"


class Availability(models.Model):
    """
    Availability model represents time slots when service providers are available.

    Service providers can set their availability for booking appointments.

    Attributes:
        provider: The occupier setting their availability
        date: The date of availability
        start_time: Start time of the availability window
        end_time: End time of the availability window
    """

    provider = models.ForeignKey(
        Occupier, on_delete=models.CASCADE, related_name="availability"
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        verbose_name = "Availability"
        verbose_name_plural = "Availabilities"
        ordering = ["date", "start_time"]

    def __str__(self) -> str:
        """Return string representation of the availability."""
        return f"{self.provider.username} available {self.date} {self.start_time}-{self.end_time}"

    def __repr__(self) -> str:
        """Return detailed string representation of the availability."""
        return f"<Availability: {self.provider.username} on {self.date}>"


class Booking(models.Model):
    """
    Booking model represents service appointments booked by clients.

    Clients can book services offered by providers. Bookings have a status
    that tracks whether they are pending, confirmed, or cancelled.

    Attributes:
        service: The service being booked
        client: The user booking the service
        date: Date of the booking
        start_time: Start time of the booking
        end_time: End time of the booking
        status: Current status of the booking (pending/confirmed/cancelled)
        created_at: Timestamp when the booking was created
    """

    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="bookings"
    )
    client = models.ForeignKey(
        Occupier, on_delete=models.CASCADE, related_name="bookings"
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("confirmed", "Confirmed"),
            ("cancelled", "Cancelled"),
        ],
        default="pending",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        """Return string representation of the booking."""
        return f"{self.client.username} booked {self.service.title} with {self.service.provider.username}"

    def __repr__(self) -> str:
        """Return detailed string representation of the booking."""
        return f"<Booking: {self.id} - {self.status}>"

    def is_pending(self) -> bool:
        """Check if booking is pending."""
        return self.status == "pending"

    def is_confirmed(self) -> bool:
        """Check if booking is confirmed."""
        return self.status == "confirmed"

    def is_cancelled(self) -> bool:
        """Check if booking is cancelled."""
        return self.status == "cancelled"
