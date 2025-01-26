from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from Occupier.models import Occupier
from datetime import date
from django.contrib.auth import get_user_model

# Create your models here.

    
#A clique can have many occupiers. 
#A clique can have many posts
#a CLIQUE CAN also contain reviews for potential customers to read 
class Clique(models.Model):
    class CliqueObjects(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(level='public')
    class Type(models.TextChoices):
        PUBLIC = "PUBLIC"
        PRIVATE = "PRIVATE"
    # options = (
    #     ('private', 'Private'),
    #     ('public', 'Public')
    # )
    occupier = models.ForeignKey(Occupier,on_delete=models.CASCADE,null=True,blank=True,related_name='cliques')
    name = models.CharField(max_length=200, null=False, blank=False,default='')
    created_at = models.DateTimeField(auto_now_add=True)
    description = models.CharField(blank=True,max_length=100)
    members = models.ManyToManyField(Occupier,blank=True)
    level = models.CharField(
        choices = Type.choices,
        max_length= 15,
        default= Type.PUBLIC,
        help_text= 
        """  
        Public: Any user can join a public clique
        Private: Requires an invite to join clique
        """
    )
    #author = models.ForeignKey('Occupier', on_delete=models.CASCADE)
    occupation = models.CharField(max_length=200,blank=False, null=False,default='')
    objects = models.Manager() # default manager
    cliqueobjects = CliqueObjects()#custom manager


    def __str__(self):
        return self.name

    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Clique"
        verbose_name_plural = "Cliques"
        









class CliquePost(models.Model):
    clique = models.ForeignKey('Clique',related_name='posts_set', on_delete=models.CASCADE)
    post = models.ForeignKey('Post', related_name="cliques_set",on_delete=models.CASCADE)

    class Meta: unique_together = ['clique','post']



    

class Post(models.Model):
# a post can only have one user
#a post can only belong to one clique
   # filters posts so only published posts are avaible in the home screen.
    class PostObjects(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(status = "posted")
    clique = models.ForeignKey(Clique, on_delete=models.CASCADE, blank=False,related_name='posts')
    content = models.TextField(max_length=400,null=False, blank=False,)
    caption = models.CharField(max_length=400,null=False, blank=False,)
    posted = models.DateTimeField(default=timezone.now,blank=False)
    occupier = models.ForeignKey(Occupier, on_delete=models.CASCADE,related_name='posts',null=False, blank=True,default=1)
    timestamp = models.DateTimeField(auto_now_add=True)
    objects = models.Manager() # default manager
    postobjects = PostObjects() # custom manager

    def __str__(self):
        return self.content


    class Meta: 
        ordering = ['-posted']
        




 
class CommentPost(models.Model):
    body = models.TextField()
    occupier = models.ForeignKey(Occupier, on_delete=models.SET_NULL,null=True)
    date = models.DateTimeField(auto_now_add=True)
    post = models.ForeignKey(Post, on_delete=models.CASCADE)

    def __str__(self):
        return str(self.post)





    

    

class Follow(models.Model):
    follower = models.ForeignKey(Occupier, related_name='following', on_delete=models.CASCADE,null=True)
    followed = models.ForeignKey(Occupier, related_name='followers', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'followed')

    def __str__(self):
        return f'{self.follower} follows {self.followed}'

class Review(models.Model):
    body = models.TextField()
    occupier = models.ForeignKey(Occupier,on_delete=models.SET_NULL,null=True)
    date = models.DateTimeField(auto_now_add=True)
    clique = models.ForeignKey(Clique, on_delete=models.CASCADE,related_name="reviews")

    def __str__(self):
        return str(self.body)

    