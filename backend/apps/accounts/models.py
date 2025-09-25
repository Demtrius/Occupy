"""
User models for the accounts app.
"""

from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.validators import EmailValidator
from django.utils import timezone
import uuid


class UserManager(BaseUserManager):
    """Custom user manager for the User model."""

    def create_user(self, email, username, occupations, password=None, **extra_fields):
        """Create and return a regular user with an email and password."""
        if not email:
            raise ValueError("Users must have an email address")
        if not username:
            raise ValueError("Users must have a username")
        if not occupations:
            raise ValueError("Users must have occupations")

        email = self.normalize_email(email)
        user = self.model(
            email=email, username=username, occupations=occupations, **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_business_user(
        self, email, username, occupations, password=None, **extra_fields
    ):
        """Create and return a business user."""
        extra_fields.setdefault("is_business_account", True)
        return self.create_user(email, username, occupations, password, **extra_fields)

    def create_superuser(
        self, email, username, occupations, password=None, **extra_fields
    ):
        """Create and return a superuser with admin privileges."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, username, occupations, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model that supports using email instead of username."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(
        verbose_name="email address",
        max_length=255,
        unique=True,
        validators=[EmailValidator()],
    )
    username = models.CharField(
        max_length=30,
        unique=True,
        help_text="Required. 30 characters or fewer. Letters, digits and @/./+/-/_ only.",
    )
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    occupations = models.CharField(
        max_length=200, help_text="User's profession or occupation"
    )
    date_of_birth = models.DateField(null=True, blank=True)

    # Account settings
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_business_account = models.BooleanField(
        default=False, help_text="Designates whether this is a business account."
    )
    is_private_account = models.BooleanField(
        default=False, help_text="Designates whether this account is private."
    )

    # Timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Profile information
    bio = models.TextField(max_length=500, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email", "occupations"]

    class Meta:
        db_table = "accounts_user"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.username

    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def short_name(self):
        """Return the user's short name."""
        return self.first_name or self.username

    def get_absolute_url(self):
        """Return the absolute URL for the user's profile."""
        return f"/users/{self.username}/"


class UserProfile(models.Model):
    """Extended profile information for users."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    social_media_links = models.JSONField(default=dict, blank=True)
    preferences = models.JSONField(default=dict, blank=True)

    # Privacy settings
    show_email = models.BooleanField(default=False)
    show_phone = models.BooleanField(default=False)
    show_location = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts_userprofile"
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"

    def __str__(self):
        return f"{self.user.username}'s profile"


class BlockedUser(models.Model):
    """Model to track blocked users."""

    blocker = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="blocked_users"
    )
    blocked = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="blocked_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "accounts_blockeduser"
        unique_together = ["blocker", "blocked"]
        verbose_name = "Blocked User"
        verbose_name_plural = "Blocked Users"

    def __str__(self):
        return f"{self.blocker.username} blocked {self.blocked.username}"
