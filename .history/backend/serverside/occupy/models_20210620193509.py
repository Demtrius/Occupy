from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
# Create your models here.


class PublicClique(models.Model):
    occupation_category = models.CharField(max_length=20)
    status = models.BooleanField(default=True)
    created = models.DateTimeField('created at')

    def __str__(self) :
        return self.name


    
