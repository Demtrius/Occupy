"""
Comprehensive Authentication Endpoint Tests

This module tests all authentication endpoints to ensure proper functionality
with the mobile app integration.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from users.models import Occupier
import json


class AuthenticationEndpointTests(TestCase):
    """Test suite for authentication endpoints"""

    def setUp(self):
        """Set up test client and test user data"""
        self.client = APIClient()

        # Test user data
        self.user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpass123",
            "occupations": "Software Developer",
        }

        # Create a test user for login tests
        self.existing_user = Occupier.objects.create_user(
            username="existinguser",
            email="existing@example.com",
            password="existingpass123",
            occupations="Designer",
        )

    def test_01_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")

        url = reverse("authentication:register")
        response = self.client.post(url, self.user_data, format="json")

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.data, indent=2)}")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["username"], self.user_data["username"])
        self.assertEqual(response.data["user"]["email"], self.user_data["email"])

        # Verify user was created in database
        user_exists = Occupier.objects.filter(
            username=self.user_data["username"]
        ).exists()
        self.assertTrue(user_exists)

        print("✓ Registration successful!")

    def test_02_registration_duplicate_username(self):
        """Test registration with duplicate username"""
        print("\n=== Testing Duplicate Username Registration ===")

        url = reverse("authentication:register")

        # Try to register with existing username
        duplicate_data = {
            "username": "existinguser",
            "email": "newemail@example.com",
            "password": "newpass123",
            "occupations": "Developer",
        }

        response = self.client.post(url, duplicate_data, format="json")

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.data, indent=2)}")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)

        print("✓ Duplicate username rejected!")

    def test_03_login_with_jwt_create(self):
        """Test JWT login endpoint"""
        print("\n=== Testing JWT Login ===")

        url = reverse("authentication:jwt_create")

        login_data = {"username": "existinguser", "password": "existingpass123"}

        response = self.client.post(url, login_data, format="json")

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.data, indent=2)}")

        # Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertIn("user", response.data)
        self.assertEqual(response.data["user"]["username"], "existinguser")

        # Store tokens for later tests
        self.access_token = response.data["access"]
        self.refresh_token = response.data["refresh"]

        print("✓ JWT login successful!")

    def test_04_login_with_email(self):
        """Test login with email instead of username"""
        print("\n=== Testing Login with Email ===")

        url = reverse("authentication:jwt_create")

        login_data = {"email": "existing@example.com", "password": "existingpass123"}

        response = self.client.post(url, login_data, format="json")

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.data, indent=2)}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("user", response.data)

        print("✓ Email login successful!")

    def test_05_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        print("\n=== Testing Invalid Credentials ===")

        url = reverse("authentication:jwt_create")

        login_data = {"username": "existinguser", "password": "wrongpassword"}

        response = self.client.post(url, login_data, format="json")

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.data, indent=2)}")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        print("✓ Invalid credentials rejected!")

    def test_06_get_current_user(self):
        """Test getting current authenticated user"""
        print("\n=== Testing Get Current User ===")

        # First login to get token
        login_url = reverse("authentication:jwt_create")
        login_data = {"username": "existinguser", "password": "existingpass123"}
        login_response = self.client.post(login_url, login_data, format="json")
        access_token = login_response.data["access"]

        # Now get current user
        url = reverse("authentication:current_user")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(url)

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.data, indent=2)}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "existinguser")
        self.assertEqual(response.data["email"], "existing@example.com")

        print("✓ Current user retrieved successfully!")

    def test_07_get_current_user_unauthorized(self):
        """Test getting current user without authentication"""
        print("\n=== Testing Unauthorized Access ===")

        url = reverse("authentication:current_user")
        response = self.client.get(url)

        print(f"Status Code: {response.status_code}")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        print("✓ Unauthorized access rejected!")

    def test_08_token_refresh(self):
        """Test JWT token refresh"""
        print("\n=== Testing Token Refresh ===")

        # First login to get tokens
        login_url = reverse("authentication:jwt_create")
        login_data = {"username": "existinguser", "password": "existingpass123"}
        login_response = self.client.post(login_url, login_data, format="json")
        refresh_token = login_response.data["refresh"]

        # Now refresh the token
        url = reverse("authentication:jwt_refresh")
        refresh_data = {"refresh": refresh_token}
        response = self.client.post(url, refresh_data, format="json")

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.data, indent=2)}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

        # Verify new access token works
        new_access_token = response.data["access"]
        user_url = reverse("authentication:current_user")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {new_access_token}")
        user_response = self.client.get(user_url)

        self.assertEqual(user_response.status_code, status.HTTP_200_OK)

        print("✓ Token refresh successful!")

    def test_09_token_verify(self):
        """Test JWT token verification"""
        print("\n=== Testing Token Verification ===")

        # First login to get token
        login_url = reverse("authentication:jwt_create")
        login_data = {"username": "existinguser", "password": "existingpass123"}
        login_response = self.client.post(login_url, login_data, format="json")
        access_token = login_response.data["access"]

        # Verify the token
        url = reverse("authentication:jwt_verify")
        verify_data = {"token": access_token}
        response = self.client.post(url, verify_data, format="json")

        print(f"Status Code: {response.status_code}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        print("✓ Token verification successful!")

    def test_10_update_user_profile(self):
        """Test updating user profile"""
        print("\n=== Testing Profile Update ===")

        # First login to get token
        login_url = reverse("authentication:jwt_create")
        login_data = {"username": "existinguser", "password": "existingpass123"}
        login_response = self.client.post(login_url, login_data, format="json")
        access_token = login_response.data["access"]

        # Update profile
        url = reverse("authentication:current_user")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        update_data = {
            "first_name": "John",
            "last_name": "Doe",
            "occupations": "Senior Designer",
        }

        response = self.client.patch(url, update_data, format="json")

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.data, indent=2)}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "John")
        self.assertEqual(response.data["last_name"], "Doe")
        self.assertEqual(response.data["occupations"], "Senior Designer")

        print("✓ Profile update successful!")

    def test_11_legacy_login_endpoint(self):
        """Test legacy login endpoint for backward compatibility"""
        print("\n=== Testing Legacy Login Endpoint ===")

        url = reverse("authentication:login_legacy")

        login_data = {"email": "existing@example.com", "password": "existingpass123"}

        response = self.client.post(url, login_data, format="json")

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.data, indent=2)}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        print("✓ Legacy login endpoint works!")

    def test_12_missing_required_fields(self):
        """Test registration with missing required fields"""
        print("\n=== Testing Missing Required Fields ===")

        url = reverse("authentication:register")

        incomplete_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            # Missing password and occupations
        }

        response = self.client.post(url, incomplete_data, format="json")

        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.data, indent=2)}")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
        self.assertIn("occupations", response.data)

        print("✓ Missing fields validation works!")


if __name__ == "__main__":
    print(
        """
    ╔════════════════════════════════════════════════════════════╗
    ║          Authentication Endpoints Test Suite              ║
    ╚════════════════════════════════════════════════════════════╝

    Run this test with:
    python manage.py test authentication.test_auth_endpoints

    Or run with verbose output:
    python manage.py test authentication.test_auth_endpoints --verbosity=2
    """
    )
