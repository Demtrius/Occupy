import os

# Session settings

SESSION_COOKIE_AGE = int(os.environ.get("SESSION_COOKIE_AGE", 1209600))  # Default - 2 weeks in seconds
SESSION_COOKIE_HTTPONLY = os.environ.get("SESSION_COOKIE_HTTPONLY", "True").lower() == "true"
SESSION_COOKIE_NAME = os.environ.get("SESSION_COOKIE_NAME", "sessionid")
SESSION_COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "False").lower() == "true"

CSRF_USE_SESSIONS = os.environ.get("CSRF_USE_SESSIONS", "True").lower() == "true"