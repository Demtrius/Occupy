import os
from pathlib import Path

# File upload and storage settings

FILE_MAX_SIZE = int(os.environ.get("FILE_MAX_SIZE", 10485760))  # 10 MiB default

# Media files
MEDIA_ROOT = os.path.join(Path(__file__).resolve().parent.parent.parent, "media")
MEDIA_URL = "/media/"

# Static files
STATIC_ROOT = os.path.join(Path(__file__).resolve().parent.parent.parent, "staticfiles")
STATIC_URL = "/static/"
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"