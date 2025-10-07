from typing import Optional
from django.db import models
from django.db.models import Manager, QuerySet
from django.utils import timezone

from .base import SoftDeleteModel


class Post(SoftDeleteModel):
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
        "Clique", on_delete=models.CASCADE, blank=False, related_name="posts"
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
    occupier = models.ForeignKey(
        "users.Occupier",
        on_delete=models.CASCADE,
        related_name="posts",
        null=False,
        blank=True,
        default=1,
    )
    postobjects = PostObjects()  # custom manager

    def __str__(self) -> str:
        """Return string representation of the post."""
        return self.content[:50] if len(self.content) > 50 else self.content

    def __repr__(self) -> str:
        """Return detailed string representation of the post."""
        return f"<Post: {self.id} by {self.occupier.username}>"

    class Meta(SoftDeleteModel.Meta):
        pass


class CommentPost(SoftDeleteModel):
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
    occupier = models.ForeignKey("users.Occupier", on_delete=models.SET_NULL, null=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")

    class Meta(SoftDeleteModel.Meta):
        verbose_name = "Comment"
        verbose_name_plural = "Comments"

    def __str__(self) -> str:
        """Return string representation of the comment."""
        return f"Comment by {self.occupier.username if self.occupier else 'Unknown'} on {self.post.caption}"

    def __repr__(self) -> str:
        """Return detailed string representation of the comment."""
        return f"<CommentPost: {self.id} on Post {self.post.id}>"


class Like(SoftDeleteModel):
    """
    Like model represents likes on posts.

    Users can like posts to show appreciation or agreement.

    Attributes:
        post: The post being liked
        user: The user who liked the post
        created_at: Timestamp when the like was created
    """

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey("users.Occupier", on_delete=models.CASCADE, related_name="likes")

    class Meta(SoftDeleteModel.Meta):
        verbose_name = "Like"
        verbose_name_plural = "Likes"
        unique_together = ["post", "user"]  # Prevent duplicate likes

    def __str__(self) -> str:
        """Return string representation of the like."""
        username = self.user.username if self.user else "Unknown"
        return f"{username} liked post {self.post.id}"

    def __repr__(self) -> str:
        """Return detailed string representation of the like."""
        return f"<Like: User {self.user.id} on Post {self.post.id}>"