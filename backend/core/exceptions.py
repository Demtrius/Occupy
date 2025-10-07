"""
Custom exceptions for the core app.
"""


from typing import Dict, Any, Optional


class ApplicationError(Exception):
    """Custom application error with message and extra data."""

    def __init__(self, message: str, extra: Optional[Dict[str, Any]] = None):
        self.message = message
        self.extra = extra or {}
        super().__init__(message)