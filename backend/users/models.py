from django.conf import settings
from datetime import datetime, timedelta
import jwt
import uuid
from typing import Optional
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from core.models.base import BaseModel


class OccupierManager(BaseUserManager["Occupier"]):
    """
    Custom manager for the Occupier user model.

    Provides methods for creating regular users, business pages, and superusers.
    All methods include proper type annotations and validation.
    """

    def create_user(
        self,
        email: str,
        username: str,
        password: Optional[str] = None,
        occupations: str = "",
    ) -> "Occupier":
        """
        Create and save a regular user with the given email and username.

        Args:
            email: User's email address (will be normalized)
            username: Unique username for the user
            password: User's password (will be hashed)

        Returns:
            Occupier: The newly created user instance

        Raises:
            ValueError: If email or username are not provided

        Examples:
            >>> user = Occupier.objects.create_user(
            ...     email='john@example.com',
            ...     username='johndoe',
            ...     password='securepass123'
            ... )
        """
        if not email:
            raise ValueError("Users must have email address")
        if not username:
            raise ValueError("Users must have username")

        user: Occupier = self.model(
            email=self.normalize_email(email),
            username=username,
            occupations=occupations,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_business_page(
        self,
        email: str,
        username: str,
        occupations: str,
        password: Optional[str] = None,
    ) -> "Occupier":
        """
        Create and save a business page user.

        Business pages are special user accounts that represent businesses
        rather than individual users. They have the is_business_page flag set to True.

        Args:
            email: Business email address (will be normalized)
            username: Unique username for the business
            occupation: Business category/occupation
            password: Account password (will be hashed)

        Returns:
            Occupier: The newly created business page user instance

        Examples:
            >>> business = Occupier.objects.create_business_page(
            ...     email='contact@acme.com',
            ...     username='acmecorp',
            ...     occupation='Technology',
            ...     password='securepass123'
            ... )
        """
        user: Occupier = self.create_user(
            email=self.normalize_email(email),
            password=password,
            username=username,
            occupations=occupations,
        )
        user.is_business_page = True
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str,
        username: str,
        password: str,
        occupations: str,
    ) -> "Occupier":
        """
        Create and save a superuser with the given credentials.

        Superusers have all permissions and can access the Django admin interface.

        Args:
            email: Superuser's email address (will be normalized)
            username: Unique username for the superuser
            password: Superuser's password (will be hashed)
            occupations: Superuser's occupation(s)

        Returns:
            Occupier: The newly created superuser instance

        Examples:
            >>> admin = Occupier.objects.create_superuser(
            ...     email='admin@example.com',
            ...     username='admin',
            ...     password='adminpass123',
            ...     occupations='Administrator'
            ... )
        """
        user: Occupier = self.create_user(
            email=self.normalize_email(email),
            password=password,
            username=username,
            occupations=occupations,
        )
        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class Occupier(AbstractBaseUser, PermissionsMixin, BaseModel):
    """
    Custom user model for the Occupy application.

    This model extends Django's AbstractBaseUser and PermissionsMixin to provide
    custom user functionality. Users can be regular accounts, business pages,
    or administrators.

    Attributes:
        id: Primary key (auto-incrementing big integer)
        email: Unique email address for the user
        username: Unique username (used for login)
        occupations: User's occupation(s) or profession
        created: Date when the user registered
        modified: Timestamp of last login (auto-updated)
        is_admin: Boolean flag for admin privileges
        is_active: Boolean flag indicating if account is active
        is_staff: Boolean flag for Django admin access
        is_superuser: Boolean flag for superuser status
        first_name: User's first name (optional)
        last_name: User's last name (optional)
        private_account: Boolean flag for account privacy
        is_business_page: Boolean flag indicating business account

    Examples:
        >>> user = Occupier.objects.create_user(
        ...     email='jane@example.com',
        ...     username='janedoe',
        ...     password='pass123',
        ...     occupations='Designer'
        ... )
        >>> print(user.username)
        'janedoe'
        >>> token = user.token
        >>> print(user.has_perm('some_permission'))
        False
    """

    # Primary key
    id = models.BigAutoField(primary_key=True)

    # Core user fields
    email = models.EmailField(
        verbose_name="email",
        max_length=59,
        unique=True,
        help_text="User's email address (used for login)",
    )
    username = models.CharField(
        max_length=30,
        unique=True,
        help_text="Unique username (used for login)",
    )
    occupations = models.CharField(
        max_length=200,
        blank=True,
        help_text="User's occupation or profession",
    )

    # Permission flags
    is_admin = models.BooleanField(
        default=False,
        help_text="Designates whether the user has admin privileges",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Designates whether this user account should be treated as active",
    )
    is_staff = models.BooleanField(
        default=False,
        help_text="Designates whether the user can log into the Django admin site",
    )
    is_superuser = models.BooleanField(
        default=False,
        help_text="Designates that this user has all permissions without explicitly assigning them",
    )

    # Optional profile fields
    first_name = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="User's first name",
    )
    last_name = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="User's last name",
    )
    profile_image = models.ImageField(
        upload_to="profiles/",
        null=True,
        blank=True,
        help_text="User's profile image",
    )
    bio = models.TextField(
        max_length=500,
        null=True,
        blank=True,
        help_text="User's biography or description",
    )

    # Account type flags
    private_account = models.BooleanField(
        default=False,
        help_text="Indicates if the account is private",
    )
    is_business_page = models.BooleanField(
        default=False,
        help_text="Indicates if this is a business account",
    )

    # Custom manager
    objects: OccupierManager = OccupierManager()

    # Django authentication settings
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email", "occupations"]

    class Meta(BaseModel.Meta):
        verbose_name = "Occupier"
        verbose_name_plural = "Occupiers"

    @property
    def token(self) -> str:
        """
        Generate a JWT token for the user.

        Creates a JWT token containing the user's ID, username, email, and a
        unique token identifier (JTI). The token expires after 24 hours.

        Returns:
            str: Encoded JWT token

        Examples:
            >>> user = Occupier.objects.get(username='johndoe')
            >>> token = user.token
            >>> print(token[:20])
            'eyJhbGciOiJIUzI1NiI...'

        Note:
            Token payload includes:
            - jti: Unique token identifier
            - user_id: User's primary key
            - username: User's username
            - email: User's email
            - exp: Expiration timestamp (24 hours from now)
            - token_type: 'access'
        """
        payload: dict = {
            "jti": str(uuid.uuid4()),  # Unique token identifier
            "user_id": self.id,  # User ID
            "username": self.username,
            "email": self.email,
            "exp": datetime.utcnow() + timedelta(hours=24),  # Token expiration
            "token_type": "access",  # Explicitly define token type
        }

        token: str = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        return token

    def __str__(self) -> str:
        """
        Return string representation of the user.

        Returns:
            str: The user's username

        Examples:
            >>> user = Occupier.objects.get(id=1)
            >>> print(user)
            'johndoe'
        """
        return self.username

    def __repr__(self) -> str:
        """
        Return detailed string representation of the user.

        Returns:
            str: Detailed representation including class name and username

        Examples:
            >>> user = Occupier.objects.get(id=1)
            >>> repr(user)
            '<Occupier: johndoe>'
        """
        return f"<Occupier: {self.username}>"

    def has_perm(self, perm: str, obj: Optional[object] = None) -> bool:
        """
        Check if the user has a specific permission.

        Admin users have all permissions. Other users are checked against
        their assigned permissions.

        Args:
            perm: Permission string to check (e.g., 'app_label.permission_name')
            obj: Optional object to check permission against

        Returns:
            bool: True if user has the permission, False otherwise

        Examples:
            >>> user = Occupier.objects.get(username='johndoe')
            >>> user.has_perm('auth.add_user')
            False
            >>> admin = Occupier.objects.get(username='admin')
            >>> admin.has_perm('auth.add_user')
            True
        """
        return self.is_admin

    def has_module_perms(self, app_label: str) -> bool:
        """
        Check if the user has permissions to view the app's admin page.

        Args:
            app_label: The label of the app to check permissions for

        Returns:
            bool: True (all users can view module permissions)

        Examples:
            >>> user = Occupier.objects.get(username='johndoe')
            >>> user.has_module_perms('auth')
            True
        """
        return True

    def get_full_name(self) -> str:
        """
        Get the user's full name.

        Returns:
            str: Full name (first name + last name) or username if not set

        Examples:
            >>> user = Occupier.objects.get(username='johndoe')
            >>> user.first_name = 'John'
            >>> user.last_name = 'Doe'
            >>> user.get_full_name()
            'John Doe'
            >>> user2 = Occupier.objects.get(username='janedoe')
            >>> user2.get_full_name()  # No names set
            'janedoe'
        """
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        elif self.first_name:
            return self.first_name
        return self.username

    def get_short_name(self) -> str:
        """
        Get the user's short name.

        Returns:
            str: First name if set, otherwise username

        Examples:
            >>> user = Occupier.objects.get(username='johndoe')
            >>> user.first_name = 'John'
            >>> user.get_short_name()
            'John'
            >>> user2 = Occupier.objects.get(username='janedoe')
            >>> user2.get_short_name()
            'janedoe'
        """
        return self.first_name if self.first_name else self.username


class Follow(BaseModel):
    """
    Follow model represents a follower-followed relationship between users.

    This model enables social networking features by tracking who follows whom.

    Attributes:
        follower: The user who is following
        followed: The user being followed
        created: Timestamp when the follow relationship was created
    """

    follower = models.ForeignKey(
        Occupier, related_name="following", on_delete=models.CASCADE, null=True
    )
    followed = models.ForeignKey(
        Occupier, related_name="followers", on_delete=models.CASCADE
    )

    class Meta(BaseModel.Meta):
        unique_together = ("follower", "followed")
        verbose_name = "Follow"
        verbose_name_plural = "Follows"

    def __str__(self) -> str:
        """
        Return string representation of the follow relationship."""
        return f"{self.follower} follows {self.followed}"

    def __repr__(self) -> str:
        """
        Return detailed string representation of the follow relationship."""
        return f"<Follow: {self.follower} -> {self.followed}>"
