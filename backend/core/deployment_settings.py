from .settings import *

DEBUG = False
ALLOWED_HOSTS = ["*"]

# Add our custom middleware at the top
MIDDLEWARE = [
    "core.middleware.ForceAllowAnyMiddleware",
] + MIDDLEWARE

# REST Framework settings (optional)
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",  # allow public access
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        # Remove TokenAuthentication to stop 401
        # "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
}
