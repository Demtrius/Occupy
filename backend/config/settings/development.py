"""
Development settings for Occupy project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Development-specific apps
INSTALLED_APPS += [
    "django_extensions",  # Provides shell_plus, graph_models, etc.
]

# Allow all hosts in development
ALLOWED_HOSTS = ["*"]

# CORS settings for development
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Database for development (can override with environment variables)
DATABASES["default"].update(
    {
        "NAME": os.getenv("DB_NAME", "occupy_dev"),
        "HOST": os.getenv("DB_HOST", "localhost"),
    }
)

# Email backend for development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Disable caching in development
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.dummy.DummyCache",
    }
}

# Development logging
LOGGING["loggers"]["apps"]["level"] = "DEBUG"
LOGGING["handlers"]["console"]["level"] = "DEBUG"

# Django Debug Toolbar (optional)
if DEBUG:
    try:
        import debug_toolbar

        INSTALLED_APPS += ["debug_toolbar"]
        MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")
        INTERNAL_IPS = ["127.0.0.1", "localhost"]

        DEBUG_TOOLBAR_CONFIG = {
            "SHOW_TOOLBAR_CALLBACK": lambda request: DEBUG,
        }
    except ImportError:
        pass

# Disable throttling in development
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {"anon": "1000/hour", "user": "10000/hour"}
