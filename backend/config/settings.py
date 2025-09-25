"""
Django settings loader for Occupy project.
Automatically loads the appropriate settings based on DJANGO_ENVIRONMENT.
"""

import os
from django.core.exceptions import ImproperlyConfigured

# Determine which settings to use
ENVIRONMENT = os.getenv("DJANGO_ENVIRONMENT", "development")

# Import the appropriate settings
if ENVIRONMENT == "production":
    from .settings.production import *  # noqa
elif ENVIRONMENT == "test":
    from .settings.test import *  # noqa
else:
    from .settings.development import *  # noqa
