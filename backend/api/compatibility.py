"""
Compatibility patch for Python 3.14 with Django 4.2.16
Fixes the 'super' object has no attribute 'dicts' error in template context
"""
import sys

# Only apply patch for Python 3.14+
if sys.version_info >= (3, 14):
    try:
        from django.template import context
        
        # Store original __copy__ method
        _original_context_copy = context.Context.__copy__
        
        def _patched_context_copy(self):
            """
            Patched __copy__ method that handles Python 3.14's super() object limitations.
            Python 3.14 changed how super() objects work, and they no longer have __dict__.
            """
            try:
                # Try the original copy method first
                return _original_context_copy(self)
            except (AttributeError, TypeError) as e:
                error_str = str(e)
                # Check if this is the specific error we're trying to fix
                if "'super' object has no attribute 'dicts'" in error_str or "no __dict__" in error_str:
                    # Create a new context instance
                    new_context = context.Context()
                    
                    # Copy the dicts list if it exists and is accessible
                    if hasattr(self, 'dicts'):
                        try:
                            # Try to access dicts directly
                            dicts = self.dicts
                            if isinstance(dicts, list):
                                new_context.dicts = list(dicts)  # Shallow copy the list
                            else:
                                new_context.dicts = []
                        except (AttributeError, TypeError):
                            # If we can't access dicts, initialize empty
                            new_context.dicts = []
                    else:
                        new_context.dicts = []
                    
                    # Copy other important attributes if they exist
                    for attr in ['autoescape', 'current_app', 'use_l10n', 'use_tz']:
                        if hasattr(self, attr):
                            try:
                                setattr(new_context, attr, getattr(self, attr))
                            except (AttributeError, TypeError):
                                pass
                    
                    return new_context
                # If it's a different error, re-raise it
                raise
        
        # Apply the patch
        context.Context.__copy__ = _patched_context_copy
    except (ImportError, AttributeError):
        # If we can't patch it, that's okay - the app will still work
        # but might hit the error in some cases
        pass

