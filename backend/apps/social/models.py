"""
Models for the social app.
"""

from django.db import models
from django.utils import timezone
from django.conf import settings
import uuid


class CliqueManager(models.Manager):
    """Custom manager for public cliques."""

    def get_queryset(self):
        return super().get_queryset().filter(privacy_level="public")


class Clique(models.Model):
    """Model for user groups/communities."""

    class PrivacyLevel(models.TextChoices):
        PUBLIC = "public", "Public"
        PRIVATE = "private", "Private"
        INVITE_ONLY = "invite_only", "Invite Only"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(max_length=500, blank=True)
    occupation = models.CharField(
        max_length=200, help_text="Related occupation or industry"
    )

    # Relationships
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_cliques",
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="CliqueMembership", related_name="cliques"
    )

    # Settings
    privacy_level = models.CharField(
        max_length=20,
        choices=PrivacyLevel.choices,
        default=PrivacyLevel.PUBLIC,
        help_text="Public: Anyone can join, Private: Requires approval, Invite Only: Only by invitation",
    )
    allow_posts = models.BooleanField(default=True)
    allow_reviews = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    # Custom managers
    objects = models.Manager()
    public = CliqueManager()

    class Meta:
        db_table = "social_clique"
        ordering = ["-created_at"]
        verbose_name = "Clique"
        verbose_name_plural = "Cliques"

    def __str__(self):
        return self.name

    @property
    def member_count(self):
        """Return the number of members in the clique."""
        return self.members.count()

    @property
    def post_count(self):
        """Return the number of posts in the clique."""
        return self.posts.count()


class CliqueMembership(models.Model):
    """Through model for clique memberships with additional fields."""

    class Role(models.TextChoices):
        MEMBER = "member", "Member"
        MODERATOR = "moderator", "Moderator"
        ADMIN = "admin", "Admin"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    clique = models.ForeignKey(Clique, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "social_cliquemembership"
        unique_together = ["user", "clique"]
        verbose_name = "Clique Membership"
        verbose_name_plural = "Clique Memberships"

    def __str__(self):
        return f"{self.user.username} in {self.clique.name} ({self.role})"


class PostManager(models.Manager):
    """Custom manager for published posts."""

    def get_queryset(self):
        return super().get_queryset().filter(is_published=True)


class Post(models.Model):
    """Model for user posts within cliques."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content = models.TextField(max_length=2000)
    caption = models.CharField(max_length=500, blank=True)

    # Relationships
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posts"
    )
    clique = models.ForeignKey(Clique, on_delete=models.CASCADE, related_name="posts")

    # Media attachments
    image = models.ImageField(upload_to="posts/images/", null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=True)
    is_pinned = models.BooleanField(default=False)

    # Engagement
    likes = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="PostLike", related_name="liked_posts"
    )

    # Custom managers
    objects = models.Manager()
    published = PostManager()

    class Meta:
        db_table = "social_post"
        ordering = ["-is_pinned", "-created_at"]
        verbose_name = "Post"
        verbose_name_plural = "Posts"

    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}..."

    @property
    def like_count(self):
        """Return the number of likes."""
        return self.likes.count()

    @property
    def comment_count(self):
        """Return the number of comments."""
        return self.comments.count()


class PostLike(models.Model):
    """Model for post likes."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "social_postlike"
        unique_together = ["user", "post"]
        verbose_name = "Post Like"
        verbose_name_plural = "Post Likes"

    def __str__(self):
        return f"{self.user.username} likes {self.post.id}"


class Comment(models.Model):
    """Model for post comments."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    body = models.TextField(max_length=1000)

    # Relationships
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments"
    )
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    # Engagement
    likes = models.ManyToManyField(
        settings.AUTH_USER_MODEL, through="CommentLike", related_name="liked_comments"
    )

    class Meta:
        db_table = "social_comment"
        ordering = ["created_at"]
        verbose_name = "Comment"
        verbose_name_plural = "Comments"

    def __str__(self):
        return f"{self.author.username}: {self.body[:30]}..."

    @property
    def like_count(self):
        """Return the number of likes."""
        return self.likes.count()


class CommentLike(models.Model):
    """Model for comment likes."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "social_commentlike"
        unique_together = ["user", "comment"]
        verbose_name = "Comment Like"
        verbose_name_plural = "Comment Likes"

    def __str__(self):
        return f"{self.user.username} likes comment {self.comment.id}"


class Follow(models.Model):
    """Model for user following relationships."""

    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="following"
    )
    followed = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="followers"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "social_follow"
        unique_together = ["follower", "followed"]
        verbose_name = "Follow"
        verbose_name_plural = "Follows"

    def __str__(self):
        return f"{self.follower.username} follows {self.followed.username}"

    def clean(self):
        """Ensure users cannot follow themselves."""
        from django.core.exceptions import ValidationError

        if self.follower == self.followed:
            raise ValidationError("Users cannot follow themselves.")


class Review(models.Model):
    """Model for clique reviews."""

    class Rating(models.IntegerChoices):
        ONE = 1, "1 Star"
        TWO = 2, "2 Stars"
        THREE = 3, "3 Stars"
        FOUR = 4, "4 Stars"
        FIVE = 5, "5 Stars"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    body = models.TextField(max_length=1000)
    rating = models.IntegerField(choices=Rating.choices)

    # Relationships
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    clique = models.ForeignKey(Clique, on_delete=models.CASCADE, related_name="reviews")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "social_review"
        unique_together = ["author", "clique"]
        ordering = ["-created_at"]
        verbose_name = "Review"
        verbose_name_plural = "Reviews"

    def __str__(self):
        return (
            f"{self.author.username} reviewed {self.clique.name} ({self.rating} stars)"
        )
