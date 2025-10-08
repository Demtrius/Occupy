import datetime
import os

# JWT settings

JWT_EXPIRATION_DELTA_SECONDS = int(os.environ.get("JWT_EXPIRATION_DELTA_SECONDS", 60 * 60 * 24 * 7))  # Default to 7 days
JWT_AUTH_COOKIE = os.environ.get("JWT_AUTH_COOKIE", "jwt")
JWT_AUTH_COOKIE_SAMESITE = os.environ.get("JWT_AUTH_COOKIE_SAMESITE", "Lax")
JWT_AUTH_HEADER_PREFIX = os.environ.get("JWT_AUTH_HEADER_PREFIX", "Bearer")

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": datetime.timedelta(hours=2),
    "REFRESH_TOKEN_LIFETIME": datetime.timedelta(days=1),
    "SIGNING_KEY": os.environ.get("SECRET_KEY", "default-secret-key"),
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    # JWT tokens don't require CSRF protection
    "UPDATE_LAST_LOGIN": True,
}