import os

# Sentry error tracking settings

SENTRY_DSN = os.environ.get("SENTRY_DSN", "")

if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=os.environ.get("SENTRY_ENVIRONMENT", "local"),
        integrations=[DjangoIntegration()],
        send_default_pii=False,
    )