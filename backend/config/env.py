from enum import Enum
from pathlib import Path
import environ
from django.core.exceptions import ImproperlyConfigured

env = environ.Env()

BASE_DIR = Path(__file__).resolve().parent.parent  # Adjust to point to backend/


def env_to_enum(enum_cls, value) -> Enum:
    for x in enum_cls:
        if x.value == value:
            return x

    raise ImproperlyConfigured(
        f"Env value {repr(value)} could not be found in {repr(enum_cls)}"
    )
