from django.db import models
from django.utils import timezone
from Occupier.models import Occupier
from .clique import Clique

class Post(models.Model):
    class PostObjects(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(status="posted")
    clique = models.ForeignKey(Clique, on_delete=models.CASCADE, blank=False, related_name='posts')
    content = models.TextField(max_length=400, null=False, blank=False)
    caption = models.CharField(max_length=400, null=False, blank=False)
    posted = models.DateTimeField(default=timezone.now, blank=False)
    occupier = models.ForeignKey(Occupier, on_delete=models.CASCADE, related_name='posts', null=False, blank=True, default=1)
    timestamp = models.DateTimeField(auto_now_add=True)
    objects = models.Manager()  # default manager
    postobjects = PostObjects()  # custom manager

    def __str__(self):
        return self.content

    class Meta:
        ordering = ['-posted']

class CommentPost(models.Model):
    body = models.TextField()
    occupier = models.ForeignKey(Occupier, on_delete=models.SET_NULL, null=True)
    date = models.DateTimeField(auto_now_add=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)

    def __str__(self):
        return str(self.post)