"""
Django settings loader for Occupy project.
Automatically loads the appropriate settings based on DJANGO_SETTINGS_MODULE.
"""

import os
from django.core.exceptions import ImproperlyConfigured

# Determine which settings to use
ENVIRONMENT = os.getenv("DJANGO_ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    from .settings.production import *
elif ENVIRONMENT == "test":
    from .settings.test import *
else:
    from .settings.development import *
