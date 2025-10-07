from typing import Optional
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Manager, QuerySet
from .base import SoftDeleteModel
from .occupation import Occupation


class Clique(SoftDeleteModel):
    """
    Clique model represents a group or community that users can join.

    Cliques can be either public (anyone can join) or private (requires invitation).
    Each clique has an owner (occupier), members, and associated posts.

    Attributes:
        occupier: The creator/owner of the clique
        name: Unique name of the clique
        created: Timestamp when the clique was created
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
        "users.Occupier",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="cliques",
    )
    name = models.CharField(max_length=200, null=False, blank=False, default="")
    description = models.CharField(blank=True, max_length=100)
    image = models.ImageField(upload_to="cliques/", blank=True, null=True)
    members = models.ManyToManyField("users.Occupier", blank=True)
    level = models.CharField(
        choices=Type.choices,
        max_length=15,
        default=Type.PUBLIC,
        help_text="""
        Public: Any user can join a public clique
        Private: Requires an invite to join clique
        """,
    )
    occupation = models.ForeignKey(
        Occupation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cliques",
        help_text="The occupation category this clique is associated with"
    )
    cliqueobjects = CliqueObjects()  # custom manager

    def __str__(self) -> str:
        """Return string representation of the clique."""
        return self.name

    def __repr__(self) -> str:
        """Return detailed string representation of the clique."""
        return f"<Clique: {self.name}>"

    def clean(self):
        """Validate that only business pages can own cliques."""
        if self.occupier and not self.occupier.is_business_page:
            raise ValidationError("Only business pages can own cliques.")

    class Meta(SoftDeleteModel.Meta):
        verbose_name = "Clique"
        verbose_name_plural = "Cliques"


class CliquePost(SoftDeleteModel):
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