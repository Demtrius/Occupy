from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
# Create your models here.


class PublicClique(models.Model):
    name = models.CharField(max_length=20)
    status = models.BooleanField()

    def __str__(self) :
        return self.name

class User(models.Model):
    name = models.CharField(max_length=100)
