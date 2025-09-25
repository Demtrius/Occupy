"""
Custom validators for the application.
"""

import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_username(value):
    """
    Validate username format.

    Username must:
    - Be 3-30 characters long
    - Contain only letters, numbers, underscores, and hyphens
    - Start with a letter or number
    - Not end with underscore or hyphen
    """
    if len(value) < 3:
        raise ValidationError(_("Username must be at least 3 characters long."))

    if len(value) > 30:
        raise ValidationError(_("Username must be at most 30 characters long."))

    if not re.match(r"^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$", value):
        raise ValidationError(
            _(
                "Username can only contain letters, numbers, underscores, and hyphens. "
                "It must start and end with a letter or number."
            )
        )

    # Check for reserved usernames
    reserved_usernames = [
        "admin",
        "api",
        "www",
        "mail",
        "ftp",
        "root",
        "support",
        "help",
        "security",
        "postmaster",
        "webmaster",
        "hostmaster",
        "abuse",
        "noreply",
        "no-reply",
        "test",
        "demo",
    ]

    if value.lower() in reserved_usernames:
        raise ValidationError(_("This username is reserved and cannot be used."))


def validate_phone_number(value):
    """
    Validate phone number format.

    Accepts various international formats:
    - +1234567890
    - +1-234-567-8900
    - +1 (234) 567-8900
    - 1234567890
    """
    # Remove all non-digit characters except +
    cleaned = re.sub(r"[^\d+]", "", value)

    # Check if it starts with + and has 10-15 digits
    if cleaned.startswith("+"):
        if not re.match(r"^\+\d{10,15}$", cleaned):
            raise ValidationError(_("Invalid phone number format."))
    else:
        # Domestic format - should be 10 digits
        if not re.match(r"^\d{10}$", cleaned):
            raise ValidationError(_("Phone number must be 10 digits."))


def validate_bio_length(value):
    """Validate bio length."""
    if len(value) > 500:
        raise ValidationError(_("Bio must be at most 500 characters long."))


def validate_occupation(value):
    """
    Validate occupation field.

    Should not contain special characters except spaces, hyphens, and apostrophes.
    """
    if not re.match(r"^[a-zA-Z\s\-']+$", value):
        raise ValidationError(
            _("Occupation can only contain letters, spaces, hyphens, and apostrophes.")
        )

    if len(value.strip()) < 2:
        raise ValidationError(_("Occupation must be at least 2 characters long."))


def validate_clique_name(value):
    """
    Validate clique name.

    Should be 3-50 characters and contain only letters, numbers, spaces, and basic punctuation.
    """
    if len(value.strip()) < 3:
        raise ValidationError(_("Clique name must be at least 3 characters long."))

    if len(value) > 50:
        raise ValidationError(_("Clique name must be at most 50 characters long."))

    if not re.match(r"^[a-zA-Z0-9\s\-_'.!]+$", value):
        raise ValidationError(
            _(
                "Clique name can only contain letters, numbers, spaces, and basic punctuation."
            )
        )


def validate_post_content(value):
    """Validate post content."""
    if len(value.strip()) < 1:
        raise ValidationError(_("Post content cannot be empty."))

    if len(value) > 2000:
        raise ValidationError(_("Post content must be at most 2000 characters long."))


def validate_comment_content(value):
    """Validate comment content."""
    if len(value.strip()) < 1:
        raise ValidationError(_("Comment cannot be empty."))

    if len(value) > 1000:
        raise ValidationError(_("Comment must be at most 1000 characters long."))


def validate_review_content(value):
    """Validate review content."""
    if len(value.strip()) < 10:
        raise ValidationError(_("Review must be at least 10 characters long."))

    if len(value) > 1000:
        raise ValidationError(_("Review must be at most 1000 characters long."))


def validate_image_file(file):
    """
    Validate uploaded image file.

    Checks file size, type, and basic security.
    """
    # Check file size (5MB limit)
    max_size = 5 * 1024 * 1024  # 5MB
    if file.size > max_size:
        raise ValidationError(_("File size too large. Maximum size is 5MB."))

    # Check file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if hasattr(file, "content_type") and file.content_type not in allowed_types:
        raise ValidationError(
            _("Invalid file type. Allowed types: JPEG, PNG, GIF, WebP.")
        )

    # Check file extension
    allowed_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    file_extension = file.name.lower().split(".")[-1] if "." in file.name else ""
    if f".{file_extension}" not in allowed_extensions:
        raise ValidationError(
            _(
                "Invalid file extension. Allowed extensions: .jpg, .jpeg, .png, .gif, .webp"
            )
        )


def validate_password_strength(password):
    """
    Validate password strength.

    Password must:
    - Be at least 8 characters long
    - Contain at least one uppercase letter
    - Contain at least one lowercase letter
    - Contain at least one digit
    - Contain at least one special character
    """
    if len(password) < 8:
        raise ValidationError(_("Password must be at least 8 characters long."))

    if not re.search(r"[A-Z]", password):
        raise ValidationError(_("Password must contain at least one uppercase letter."))

    if not re.search(r"[a-z]", password):
        raise ValidationError(_("Password must contain at least one lowercase letter."))

    if not re.search(r"\d", password):
        raise ValidationError(_("Password must contain at least one digit."))

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError(
            _("Password must contain at least one special character.")
        )

    # Check for common weak passwords
    weak_passwords = [
        "password",
        "12345678",
        "qwerty",
        "abc123",
        "password123",
        "admin",
        "letmein",
        "welcome",
        "123456789",
        "password1",
    ]

    if password.lower() in weak_passwords:
        raise ValidationError(
            _("This password is too common. Please choose a stronger password.")
        )
