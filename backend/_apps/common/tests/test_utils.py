"""
Tests for common utilities.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.common.utils import (
    generate_unique_slug,
    generate_upload_path,
    generate_secure_token,
    hash_string,
    validate_image_file,
    clean_html_content,
    paginate_queryset,
    format_file_size,
)

User = get_user_model()


class UtilsTest(TestCase):
    """Test cases for utility functions."""

    def test_generate_unique_slug(self):
        """Test generating unique slugs."""
        # Create a user to test slug uniqueness
        User.objects.create_user(
            username="test-user",
            email="test@example.com",
            occupations="Developer",
            password="password123",
        )

        # This should generate 'test-user-1' since 'test-user' exists
        slug = generate_unique_slug("Test User", User, "username")
        self.assertEqual(slug, "test-user-1")

        # Test with a unique slug
        unique_slug = generate_unique_slug("Unique User", User, "username")
        self.assertEqual(unique_slug, "unique-user")

    def test_generate_upload_path(self):
        """Test generating upload paths."""
        # Mock instance
        instance = type("MockInstance", (), {})()

        # Test without folder
        path = generate_upload_path(instance, "test.jpg")
        self.assertTrue(path.endswith(".jpg"))
        self.assertEqual(len(path.split(".")), 2)

        # Test with folder
        path_with_folder = generate_upload_path(instance, "test.png", "avatars")
        self.assertTrue(path_with_folder.startswith("avatars/"))
        self.assertTrue(path_with_folder.endswith(".png"))

    def test_generate_secure_token(self):
        """Test generating secure tokens."""
        token1 = generate_secure_token()
        token2 = generate_secure_token()

        # Tokens should be different
        self.assertNotEqual(token1, token2)

        # Test custom length
        long_token = generate_secure_token(64)
        self.assertGreater(len(long_token), len(token1))

    def test_hash_string(self):
        """Test string hashing."""
        text = "test string"
        hash1 = hash_string(text)
        hash2 = hash_string(text)

        # Same input should produce same hash
        self.assertEqual(hash1, hash2)

        # Different input should produce different hash
        hash3 = hash_string("different string")
        self.assertNotEqual(hash1, hash3)

        # Test with salt
        hash_with_salt = hash_string(text, "salt")
        self.assertNotEqual(hash1, hash_with_salt)

    def test_clean_html_content(self):
        """Test HTML content cleaning."""
        dirty_html = "<script>alert('xss')</script><p>Safe content</p>"
        cleaned = clean_html_content(dirty_html)

        # Should escape HTML
        self.assertNotIn("<script>", cleaned)
        self.assertIn("&lt;script&gt;", cleaned)

    def test_paginate_queryset(self):
        """Test queryset pagination."""
        # Create test users
        users = []
        for i in range(25):
            user = User.objects.create_user(
                username=f"user{i}",
                email=f"user{i}@example.com",
                occupations="Developer",
                password="password123",
            )
            users.append(user)

        queryset = User.objects.all()

        # Test first page
        page1 = paginate_queryset(queryset, page=1, page_size=10)
        self.assertEqual(len(page1["items"]), 10)
        self.assertEqual(page1["page"], 1)
        self.assertEqual(page1["pages"], 3)
        self.assertEqual(page1["total"], 25)
        self.assertTrue(page1["has_next"])
        self.assertFalse(page1["has_previous"])

        # Test middle page
        page2 = paginate_queryset(queryset, page=2, page_size=10)
        self.assertEqual(len(page2["items"]), 10)
        self.assertEqual(page2["page"], 2)
        self.assertTrue(page2["has_next"])
        self.assertTrue(page2["has_previous"])

        # Test last page
        page3 = paginate_queryset(queryset, page=3, page_size=10)
        self.assertEqual(len(page3["items"]), 5)
        self.assertEqual(page3["page"], 3)
        self.assertFalse(page3["has_next"])
        self.assertTrue(page3["has_previous"])

    def test_format_file_size(self):
        """Test file size formatting."""
        self.assertEqual(format_file_size(0), "0B")
        self.assertEqual(format_file_size(1024), "1.0KB")
        self.assertEqual(format_file_size(1024 * 1024), "1.0MB")
        self.assertEqual(format_file_size(1024 * 1024 * 1024), "1.0GB")
        self.assertEqual(format_file_size(1536), "1.5KB")  # 1.5KB

    def test_validate_image_file(self):
        """Test image file validation."""

        # Mock file object
        class MockFile:
            def __init__(self, size, content_type):
                self.size = size
                self.content_type = content_type

        # Valid image
        valid_image = MockFile(1024 * 1024, "image/jpeg")  # 1MB JPEG
        result = validate_image_file(valid_image)
        self.assertTrue(result["valid"])
        self.assertEqual(len(result["errors"]), 0)

        # Too large image
        large_image = MockFile(6 * 1024 * 1024, "image/jpeg")  # 6MB JPEG
        result = validate_image_file(large_image)
        self.assertFalse(result["valid"])
        self.assertGreater(len(result["errors"]), 0)

        # Invalid type
        invalid_type = MockFile(1024, "text/plain")
        result = validate_image_file(invalid_type)
        self.assertFalse(result["valid"])
        self.assertGreater(len(result["errors"]), 0)
