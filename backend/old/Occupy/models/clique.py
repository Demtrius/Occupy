from django.db import models
from Occupier.models import Occupier

class Clique(models.Model):
    class CliqueObjects(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(level='public')
    class Type(models.TextChoices):
        PUBLIC = "PUBLIC"
        PRIVATE = "PRIVATE"
    occupier = models.ForeignKey(Occupier, on_delete=models.CASCADE, null=True, blank=True, related_name='cliques')
    name = models.CharField(max_length=200, null=False, blank=False, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.CharField(blank=True, max_length=100)
    members = models.ManyToManyField(Occupier, blank=True)
    level = models.CharField(
        choices=Type.choices,
        max_length=15,
        default=Type.PUBLIC,
        help_text=
        """
        Public: Any user can join a public clique
        Private: Requires an invite to join clique
        """
    )
    occupation = models.CharField(max_length=200, blank=False, null=False, default='')
    objects = models.Manager()  # default manager
    cliqueobjects = CliqueObjects()  # custom manager

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Clique"
        verbose_name_plural = "Cliques"