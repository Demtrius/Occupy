# pyright: reportArgumentType=false

import datetime
import os
from config.env import env

# Custom JWT settings for our implementation

JWT_ACCESS_TOKEN_LIFETIME = datetime.timedelta(hours=2)
JWT_REFRESH_TOKEN_LIFETIME = datetime.timedelta(days=1)
JWT_SIGNING_KEY = env.str(
    "SECRET_KEY",
    default="django-insecure-g^*rc8ie0tilq&foi0p4ft+&y+8c3heosv+-j-fh%l6wpz9-i^",
)
JWT_AUTH_HEADER_TYPES = ("Bearer",)
JWT_USER_ID_FIELD = "id"
JWT_USER_ID_CLAIM = "user_id"

# Legacy settings (kept for compatibility)
JWT_EXPIRATION_DELTA_SECONDS = int(
    os.environ.get("JWT_EXPIRATION_DELTA_SECONDS", 60 * 60 * 24 * 7)
)  # Default to 7 days
JWT_AUTH_COOKIE = os.environ.get("JWT_AUTH_COOKIE", "jwt")
JWT_AUTH_COOKIE_SAMESITE = os.environ.get("JWT_AUTH_COOKIE_SAMESITE", "Lax")
JWT_AUTH_HEADER_PREFIX = os.environ.get("JWT_AUTH_HEADER_PREFIX", "Bearer")
