"""
Tests for accounts views.
"""

from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class UserRegistrationViewTest(APITestCase):
    """Test cases for user registration."""

    def setUp(self):
        """Set up test data."""
        self.registration_url = reverse("accounts:register")
        self.valid_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "TestPass123!",
            "password_confirm": "TestPass123!",
            "occupations": "Software Developer",
            "first_name": "John",
            "last_name": "Doe",
        }

    def test_successful_registration(self):
        """Test successful user registration."""
        response = self.client.post(self.registration_url, self.valid_data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="testuser").exists())
        self.assertIn("user", response.data)
        self.assertIn("tokens", response.data)

    def test_registration_with_mismatched_passwords(self):
        """Test registration with mismatched passwords."""
        data = self.valid_data.copy()
        data["password_confirm"] = "DifferentPassword123!"

        response = self.client.post(self.registration_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="testuser").exists())

    def test_registration_with_duplicate_username(self):
        """Test registration with duplicate username."""
        User.objects.create_user(
            username="testuser",
            email="existing@example.com",
            occupations="Developer",
            password="password123",
        )

        response = self.client.post(self.registration_url, self.valid_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_with_duplicate_email(self):
        """Test registration with duplicate email."""
        User.objects.create_user(
            username="existinguser",
            email="test@example.com",
            occupations="Developer",
            password="password123",
        )

        response = self.client.post(self.registration_url, self.valid_data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserLoginViewTest(APITestCase):
    """Test cases for user login."""

    def setUp(self):
        """Set up test data."""
        self.login_url = reverse("accounts:login")
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            occupations="Software Developer",
            password="testpass123",
        )

    def test_successful_login(self):
        """Test successful user login."""
        data = {"username": "testuser", "password": "testpass123"}

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user", response.data)
        self.assertIn("tokens", response.data)

    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials."""
        data = {"username": "testuser", "password": "wrongpassword"}

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_inactive_user(self):
        """Test login with inactive user."""
        self.user.is_active = False
        self.user.save()

        data = {"username": "testuser", "password": "testpass123"}

        response = self.client.post(self.login_url, data)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserProfileViewTest(APITestCase):
    """Test cases for user profile management."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            occupations="Software Developer",
            password="testpass123",
        )
        self.profile_url = reverse("accounts:profile")

        # Authenticate the user
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_get_user_profile(self):
        """Test retrieving user profile."""
        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "testuser")
        self.assertEqual(response.data["email"], "test@example.com")

    def test_update_user_profile(self):
        """Test updating user profile."""
        data = {
            "first_name": "John",
            "last_name": "Doe",
            "bio": "Updated bio",
            "location": "New York",
        }

        response = self.client.patch(self.profile_url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "John")
        self.assertEqual(self.user.last_name, "Doe")
        self.assertEqual(self.user.bio, "Updated bio")
        self.assertEqual(self.user.location, "New York")

    def test_profile_access_without_authentication(self):
        """Test accessing profile without authentication."""
        self.client.credentials()  # Remove authentication

        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserDetailViewTest(APITestCase):
    """Test cases for user detail view."""

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

        # Authenticate user1
        refresh = RefreshToken.for_user(self.user1)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_get_user_detail(self):
        """Test retrieving user details by username."""
        url = reverse("accounts:user_detail", kwargs={"username": "user2"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "user2")

    def test_get_nonexistent_user(self):
        """Test retrieving details of non-existent user."""
        url = reverse("accounts:user_detail", kwargs={"username": "nonexistent"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UserListViewTest(APITestCase):
    """Test cases for user list view."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            occupations="Developer",
            password="testpass123",
        )

        # Create additional users
        for i in range(5):
            User.objects.create_user(
                username=f"user{i}",
                email=f"user{i}@example.com",
                occupations=f"Occupation {i}",
                password="testpass123",
            )

        self.list_url = reverse("accounts:user_list")

        # Authenticate the user
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_get_user_list(self):
        """Test retrieving user list."""
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 6)  # 6 users total

    def test_search_users(self):
        """Test searching users."""
        response = self.client.get(self.list_url, {"search": "testuser"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["username"], "testuser")

    def test_user_list_without_authentication(self):
        """Test accessing user list without authentication."""
        self.client.credentials()  # Remove authentication

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
