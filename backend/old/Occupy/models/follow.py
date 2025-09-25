from django.db import models
from Occupier.models import Occupier

class Follow(models.Model):
    follower = models.ForeignKey(Occupier, related_name='following', on_delete=models.CASCADE, null=True)
    followed = models.ForeignKey(Occupier, related_name='followers', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'followed')

    def __str__(self):
        return f'{self.follower} follows {self.followed}'