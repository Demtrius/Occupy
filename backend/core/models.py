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


class Like(models.Model):
    """
    Like model represents likes on posts.

    Users can like posts to show appreciation or agreement.

    Attributes:
        post: The post being liked
        user: The user who liked the post
        created_at: Timestamp when the like was created
    """

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(Occupier, on_delete=models.CASCADE, related_name="likes")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Like"
        verbose_name_plural = "Likes"
        ordering = ["-created_at"]
        unique_together = ["post", "user"]  # Prevent duplicate likes

    def __str__(self) -> str:
        """Return string representation of the like."""
        username = self.user.username if self.user else "Unknown"
        return f"{username} liked post {self.post.id}"

    def __repr__(self) -> str:
        """Return detailed string representation of the like."""
        return f"<Like: User {self.user.id} on Post {self.post.id}>"


class Review(models.Model):
    """
    Review model represents user reviews of services/bookings.

    Users can leave reviews and ratings for services they've booked and completed.

    Attributes:
        booking: The booking this review is for
        clique: The clique/business being reviewed
        user: The user who created the review (reviewer)
        rating: Rating from 1-5 stars
        comment: Optional text review
        created_at: Timestamp when the review was created
        updated_at: Timestamp when the review was last updated
    """

    booking = models.OneToOneField(
        "Booking",
        on_delete=models.CASCADE,
        related_name="review",
        null=True,
        blank=True,
        help_text="The booking this review is for",
    )
    clique = models.ForeignKey(
        Clique,
        on_delete=models.CASCADE,
        related_name="reviews",
        help_text="The clique/business being reviewed",
    )
    user = models.ForeignKey(
        Occupier,
        on_delete=models.SET_NULL,
        null=True,
        related_name="reviews_written",
        help_text="The user who wrote this review",
    )
    rating = models.PositiveSmallIntegerField(
        help_text="Rating from 1-5 stars",
        choices=[(i, f"{i} star{'s' if i != 1 else ''}") for i in range(1, 6)],
        default=5,
    )
    comment = models.TextField(
        blank=True, null=True, help_text="Optional review comment"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Review"
        verbose_name_plural = "Reviews"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        """Return string representation of the review."""
        username = self.user.username if self.user else "Unknown"
        return f"{username} - {self.rating} stars on {self.clique.name}"

    def __repr__(self) -> str:
        """Return detailed string representation of the review."""
        return f"<Review: {self.id} - {self.rating} stars on Clique {self.clique.id}>"


class Service(models.Model):
    """
    Service model represents services offered by cliques (business pages).

    Business pages can offer services to other users through their cliques.
    Services have pricing, duration, and availability information.

    Attributes:
        clique: The clique offering this service
        provider: The occupier who created/manages this service
        title: Name/title of the service
        description: Detailed description of the service
        price: Cost of the service (optional)
        duration_minutes: Expected duration of the service in minutes
        is_active: Whether the service is currently available for booking
        created_at: Timestamp when the service was created
        updated_at: Timestamp when the service was last updated
    """

    clique = models.ForeignKey(
        Clique, on_delete=models.CASCADE, related_name="services"
    )
    provider = models.ForeignKey(
        Occupier, on_delete=models.CASCADE, related_name="services"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=60)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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

    Service providers can set their availability for booking appointments through their cliques.

    Attributes:
        clique: The clique this availability is for
        provider: The occupier setting their availability
        date: The date of availability
        start_time: Start time of the availability window
        end_time: End time of the availability window
        is_recurring: Whether this availability repeats weekly
        day_of_week: Day of week for recurring availability (0=Monday, 6=Sunday)
    """

    clique = models.ForeignKey(
        Clique, on_delete=models.CASCADE, related_name="availability_slots"
    )
    provider = models.ForeignKey(
        Occupier, on_delete=models.CASCADE, related_name="availability"
    )
    date = models.DateField(null=True, blank=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_recurring = models.BooleanField(default=False)
    day_of_week = models.IntegerField(
        null=True,
        blank=True,
        choices=[
            (0, "Monday"),
            (1, "Tuesday"),
            (2, "Wednesday"),
            (3, "Thursday"),
            (4, "Friday"),
            (5, "Saturday"),
            (6, "Sunday"),
        ],
    )

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

    Clients can book services offered by providers through cliques. Bookings have a status
    that tracks whether they are pending, confirmed, or cancelled.

    Attributes:
        service: The service being booked
        clique: The clique providing the service
        client: The user booking the service
        provider: The service provider (for easy access)
        date: Date of the booking
        start_time: Start time of the booking
        end_time: End time of the booking
        status: Current status of the booking (pending/confirmed/cancelled)
        notes: Additional notes from the client
        cancellation_reason: Reason for cancellation (if cancelled)
        created_at: Timestamp when the booking was created
        updated_at: Timestamp when the booking was last updated
    """

    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="bookings"
    )
    clique = models.ForeignKey(
        Clique, on_delete=models.CASCADE, related_name="bookings"
    )
    client = models.ForeignKey(
        Occupier, on_delete=models.CASCADE, related_name="bookings"
    )
    provider = models.ForeignKey(
        Occupier,
        on_delete=models.CASCADE,
        related_name="provider_bookings",
        null=True,
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
            ("completed", "Completed"),
        ],
        default="pending",
    )
    notes = models.TextField(blank=True, default="")
    cancellation_reason = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
