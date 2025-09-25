"""
Tests for accounts models.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from apps.accounts.models import UserProfile, BlockedUser

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for the User model."""

    def setUp(self):
        """Set up test data."""
        self.user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "occupations": "Software Developer",
            "password": "testpass123",
        }

    def test_create_user(self):
        """Test creating a regular user."""
        user = User.objects.create_user(**self.user_data)

        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.email, "test@example.com")
        self.assertEqual(user.occupations, "Software Developer")
        self.assertTrue(user.check_password("testpass123"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertFalse(user.is_business_account)

    def test_create_business_user(self):
        """Test creating a business user."""
        user = User.objects.create_business_user(**self.user_data)

        self.assertTrue(user.is_business_account)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(**self.user_data)

        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_active)

    def test_create_user_without_email(self):
        """Test creating a user without email raises ValueError."""
        user_data = self.user_data.copy()
        del user_data["email"]

        with self.assertRaises(ValueError):
            User.objects.create_user(**user_data)

    def test_create_user_without_username(self):
        """Test creating a user without username raises ValueError."""
        user_data = self.user_data.copy()
        del user_data["username"]

        with self.assertRaises(ValueError):
            User.objects.create_user(**user_data)

    def test_create_user_without_occupations(self):
        """Test creating a user without occupations raises ValueError."""
        user_data = self.user_data.copy()
        del user_data["occupations"]

        with self.assertRaises(ValueError):
            User.objects.create_user(**user_data)

    def test_user_string_representation(self):
        """Test the string representation of the user."""
        user = User.objects.create_user(**self.user_data)
        self.assertEqual(str(user), "testuser")

    def test_user_full_name(self):
        """Test the full_name property."""
        user_data = self.user_data.copy()
        user_data.update({"first_name": "John", "last_name": "Doe"})
        user = User.objects.create_user(**user_data)

        self.assertEqual(user.full_name, "John Doe")

    def test_user_short_name(self):
        """Test the short_name property."""
        user_data = self.user_data.copy()
        user_data["first_name"] = "John"
        user = User.objects.create_user(**user_data)

        self.assertEqual(user.short_name, "John")

        # Test fallback to username
        user.first_name = ""
        self.assertEqual(user.short_name, "testuser")


class UserProfileModelTest(TestCase):
    """Test cases for the UserProfile model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            occupations="Software Developer",
            password="testpass123",
        )

    def test_user_profile_created_automatically(self):
        """Test that a UserProfile is created automatically when a User is created."""
        self.assertTrue(hasattr(self.user, "profile"))
        self.assertIsInstance(self.user.profile, UserProfile)

    def test_user_profile_string_representation(self):
        """Test the string representation of the user profile."""
        expected = f"{self.user.username}'s profile"
        self.assertEqual(str(self.user.profile), expected)


class BlockedUserModelTest(TestCase):
    """Test cases for the BlockedUser model."""

    def setUp(self):
        """Set up test data."""
        self.user1 = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            occupations="Developer",
            password="testpass123",
        )
        self.user2 = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            occupations="Designer",
            password="testpass123",
        )

    def test_create_blocked_user(self):
        """Test creating a blocked user relationship."""
        blocked = BlockedUser.objects.create(
            blocker=self.user1, blocked=self.user2, reason="Spam"
        )

        self.assertEqual(blocked.blocker, self.user1)
        self.assertEqual(blocked.blocked, self.user2)
        self.assertEqual(blocked.reason, "Spam")

    def test_blocked_user_string_representation(self):
        """Test the string representation of blocked user."""
        blocked = BlockedUser.objects.create(blocker=self.user1, blocked=self.user2)

        expected = f"{self.user1.username} blocked {self.user2.username}"
        self.assertEqual(str(blocked), expected)

    def test_unique_blocked_relationship(self):
        """Test that a user can only block another user once."""
        BlockedUser.objects.create(blocker=self.user1, blocked=self.user2)

        # Trying to create the same relationship again should raise an error
        with self.assertRaises(Exception):  # IntegrityError in actual database
            BlockedUser.objects.create(blocker=self.user1, blocked=self.user2)
