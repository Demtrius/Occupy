import os

# https://docs.celeryproject.org/en/stable/userguide/configuration.html

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "amqp://guest:guest@localhost//")
CELERY_RESULT_BACKEND = "django-db"

CELERY_TIMEZONE = "UTC"

CELERY_TASK_SOFT_TIME_LIMIT = 20  # seconds
CELERY_TASK_TIME_LIMIT = 30  # seconds
CELERY_TASK_MAX_RETRIES = 3