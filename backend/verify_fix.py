import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection

try:
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(api_house)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'listing_type' in columns:
            print("SUCCESS: listing_type column exists!")
            print(f"All columns: {columns}")
            sys.exit(0)
        else:
            print("ERROR: listing_type column still missing!")
            print(f"Current columns: {columns}")
            print("\nPlease run: python add_listing_type.py")
            sys.exit(1)
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

