"""
Common utility functions.
"""

import uuid
import hashlib
import secrets
from typing import Optional, Dict, Any
from django.utils.text import slugify
from django.core.files.storage import default_storage
from django.conf import settings


def generate_unique_slug(text: str, model_class, slug_field: str = "slug") -> str:
    """
    Generate a unique slug for a model instance.

    Args:
        text: The text to slugify
        model_class: The model class to check against
        slug_field: The field name for the slug (default: 'slug')

    Returns:
        A unique slug string
    """
    base_slug = slugify(text)
    slug = base_slug
    counter = 1

    while model_class.objects.filter(**{slug_field: slug}).exists():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


def generate_upload_path(instance, filename: str, folder: str = "") -> str:
    """
    Generate a unique upload path for files.

    Args:
        instance: The model instance
        filename: The original filename
        folder: Optional folder name

    Returns:
        A unique file path
    """
    # Extract file extension
    ext = filename.split(".")[-1] if "." in filename else ""

    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex

    # Build path
    if folder:
        return f"{folder}/{unique_filename}"
    return unique_filename


def generate_secure_token(length: int = 32) -> str:
    """
    Generate a secure random token.

    Args:
        length: The length of the token in bytes

    Returns:
        A secure random token
    """
    return secrets.token_urlsafe(length)


def hash_string(text: str, salt: Optional[str] = None) -> str:
    """
    Hash a string using SHA-256.

    Args:
        text: The text to hash
        salt: Optional salt to add

    Returns:
        The hashed string
    """
    if salt:
        text = f"{text}{salt}"

    return hashlib.sha256(text.encode()).hexdigest()


def validate_image_file(file) -> Dict[str, Any]:
    """
    Validate an uploaded image file.

    Args:
        file: The uploaded file

    Returns:
        A dictionary with validation results
    """
    result = {"valid": True, "errors": [], "warnings": []}

    # Check file size (5MB limit)
    max_size = 5 * 1024 * 1024  # 5MB
    if file.size > max_size:
        result["valid"] = False
        result["errors"].append(
            f"File size too large. Maximum size is {max_size // (1024*1024)}MB"
        )

    # Check file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if hasattr(file, "content_type") and file.content_type not in allowed_types:
        result["valid"] = False
        result["errors"].append(
            f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
        )

    return result


def clean_html_content(content: str) -> str:
    """
    Clean HTML content to prevent XSS attacks.

    Args:
        content: The HTML content to clean

    Returns:
        Cleaned HTML content
    """
    # This is a basic implementation. In production, use a library like bleach
    import html

    return html.escape(content)


def paginate_queryset(queryset, page: int = 1, page_size: int = 20):
    """
    Paginate a queryset.

    Args:
        queryset: The queryset to paginate
        page: The page number (1-based)
        page_size: The number of items per page

    Returns:
        A dictionary with pagination information
    """
    from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

    paginator = Paginator(queryset, page_size)

    try:
        page_obj = paginator.page(page)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)

    return {
        "items": page_obj.object_list,
        "page": page_obj.number,
        "pages": paginator.num_pages,
        "per_page": page_size,
        "total": paginator.count,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "next_page": page_obj.next_page_number() if page_obj.has_next() else None,
        "previous_page": (
            page_obj.previous_page_number() if page_obj.has_previous() else None
        ),
    }


def send_notification_email(to_email: str, subject: str, message: str) -> bool:
    """
    Send a notification email.

    Args:
        to_email: The recipient email
        subject: The email subject
        message: The email message

    Returns:
        True if email was sent successfully, False otherwise
    """
    from django.core.mail import send_mail

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return True
    except Exception:
        return False


def get_client_ip(request) -> str:
    """
    Get the client IP address from the request.

    Args:
        request: The HTTP request object

    Returns:
        The client IP address
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def format_file_size(size_bytes: int) -> str:
    """
    Format a file size in bytes to human readable format.

    Args:
        size_bytes: The size in bytes

    Returns:
        Formatted file size string
    """
    if size_bytes == 0:
        return "0B"

    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1

    return f"{size_bytes:.1f}{size_names[i]}"
