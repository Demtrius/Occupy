from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager,PermissionsMixin
from rest_framework_simplejwt.tokens import RefreshToken
import jwt
from django.conf import settings
from datetime import datetime,timedelta
# Create your models here.




#Manager account 
class OccupierManager(BaseUserManager):
    def create_user(self,email,username,occupations,password=None):
        if  not email:
            raise ValueError('Users must have email address')
        if not username:
            raise ValueError('Users must have username')
        if not occupations:
            raise ValueError('Occupiers must have occupation')
        # if not dob:
        #     raise ValueError('Users must enter dob')
        user = self.model(
            email = self.normalize_email(email),
            username =username,
            occupations = occupations,
            # dob = dob
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self,email,username,password,occupations):
        user = self.create_user(
            email = self.normalize_email(email),
            password = password,
            username=username,
            # dob =dob,
            occupations = occupations
        )
        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

#Occupier model
class Occupier(AbstractBaseUser,PermissionsMixin):
    #occupiers can join several cliques
    #all posts must go to a specific clique
    email = models.EmailField(verbose_name='email',max_length=59, unique=True)
    username = models.CharField(max_length=30,unique=True)
    occupations = models.CharField(max_length=200,null=False) #amount of occupations user does
    date_joined = models.DateField(verbose_name='date joined', auto_now_add=True)
    last_login = models.DateTimeField(verbose_name='last login', auto_now=True)
    is_admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    # dob = models.DateField(blank=True, null=True,unique=False)
    password = models.CharField(unique=True, max_length=200)
    first_name = models.CharField(max_length=200,null=True)
    last_name = models.CharField(max_length=200,null=True)
    private_account = models.BooleanField(default=False)
    followers = models.ManyToManyField('self',blank=True,related_name='occupier_followers',symmetrical=False)
    following = models.ManyToManyField('self',blank=True,related_name='occupier_following', symmetrical=False)
    pending_request = models.ManyToManyField('self',blank=True,related_name='pendingRequest',symmetrical=False)
    blocked_occupier = models.ManyToManyField('self',blank=True,related_name='occupier_blocked')

    objects = OccupierManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email','occupations','password','dob']

    @property
    def token(self):
        token = jwt.encode({'username':self.username,'email':self.email,'exp':datetime.utcnow() + timedelta(hours=24)},
        settings.SECRET_KEY,
        algorithm='HS256' )
        return token



def __str___(self):
    return self.username


def has_perm(self,perm, obj=None):
    return self.is_admin



def has_module_perms(self,app_label):
    return True



