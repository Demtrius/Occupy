import os

DEBUG_TOOLBAR_ENABLED = os.environ.get("DEBUG_TOOLBAR_ENABLED", "True").lower() == "true"
DEBUG_TOOLBAR_CONFIG = {"SHOW_TOOLBAR_CALLBACK": "config.settings.debug_toolbar.setup.show_toolbar"}