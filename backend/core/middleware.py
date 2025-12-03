# core/middleware.py

from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

class ForceAllowAnyMiddleware:
    """
    Forces all DRF APIViews to use AllowAny permissions, ignoring view-level IsAuthenticated.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Before view
        if hasattr(request, "user") and hasattr(request, "resolver_match"):
            view_func = request.resolver_match.func
            # Check if it is a DRF view
            if hasattr(view_func, "cls") and issubclass(view_func.cls, APIView):
                # Override permission_classes
                view_func.cls.permission_classes = [AllowAny]

        response = self.get_response(request)
        return response
