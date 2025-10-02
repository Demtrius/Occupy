from django.db import models
from Occupier.models import Occupier
from .clique import Clique

class Review(models.Model):
    body = models.TextField()
    user = models.ForeignKey(Occupier, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    clique = models.ForeignKey(Clique, on_delete=models.CASCADE, related_name="reviews")

    def __str__(self):
        return f"{self.user} - {self.body[:20]}"