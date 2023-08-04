from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from Occupier.models import Occupier
from datetime import date
from django.contrib.auth import get_user_model

# Create your models here.





    
#A clique can have many occupiers. 
#A clique can have many posts.
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
    members = models.ManyToManyField(Occupier,blank=True,related_name='members')
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




class CliquePost(models.Model):
    clique = models.ForeignKey('Clique',related_name='posts_set', on_delete=models.CASCADE)
    post = models.ForeignKey('Post', related_name="cliques_set",on_delete=models.CASCADE)

    class Meta: unique_together = ['clique','post']


class Comment(models.Model):
    post = models.ForeignKey('Post', related_name="comments",on_delete=models.CASCADE)
    occupier = models.ForeignKey(Occupier, related_name="comments_authored",on_delete=models.CASCADE)
    body = models.TextField()
    created_on = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=False)


    class Meta:
        ordering = ['created_on']
    def __str__(self):
        return 'Comment {} by {}'.format(self.body,self.occupier)

class Post(models.Model):
# a post can only have one user
#a post can only belong to one clique
   # filters posts so only published posts are avaible in the home screen.
    class PostObjects(models.Manager):
        def get_queryset(self):
            return super().get_queryset().filter(status = "posted")
    options = (
        ('draft' , 'Draft'),
        ('posted' , 'Posted'),
    )
    clique = models.ForeignKey(Clique, on_delete=models.CASCADE, blank=False)
    content = models.TextField(max_length=400,null=False, blank=False,)
    caption = models.CharField(max_length=400,null=False, blank=False,)
    posted = models.DateTimeField(default=timezone.now,blank=False)
    occupier = models.ForeignKey(Occupier, on_delete=models.CASCADE,related_name='posts',null=True, blank=True)
    status = models.CharField(max_length=12, choices=options, default='posted',blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    objects = models.Manager() # default manager
    postobjects = PostObjects() # custom manager

    # class Meta: 
    #     ordering = ('-posted',)

    
        
    def __str__(self):
        #returns caption
        return self.caption
    
    # def __str__(self) -> str:
    #     return self.clique




# class CliqueMember(models.Model):
    
#     class MemberTypes(models.TextChoices):
#         ADMIN ="ADMIN"
#         MEMBER = "MEMBER"
    
#     clique = models.ForeignKey(Clique, on_delete=models.CASCADE,related_name="members")
#     occupier = models.ForeignKey(Occupier, on_delete=models.CASCADE,related_name='members')
#     member_type = models.CharField(
#         choices=MemberTypes.choices,
#         max_length=10,
#         default=MemberTypes.MEMBER,
#         help_text="""
#             ADMIN: Has (all)permissions to add or remove members as moderators, ban or mute members.<br>
#             MODERATOR: Has permission to add, remove, ban or mute members.<br>
#             MEMBER: Can post, like, comment, share, bookmark group posts.
#         """
#     )
    
#     class Meta:
#         # ordering = ["-created_at"]
#         verbose_name = "Group Member"
#         verbose_name_plural = "Group Members"