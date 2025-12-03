import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.db import connection

print("=" * 70, file=sys.stderr)
print("FORCE FIXING listing_type column", file=sys.stderr)
print("=" * 70, file=sys.stderr)

try:
    with connection.cursor() as cursor:
        # Get current columns
        cursor.execute("PRAGMA table_info(api_house)")
        columns_before = [row[1] for row in cursor.fetchall()]
        print(f"BEFORE: {columns_before}", file=sys.stderr)
        
        if 'listing_type' not in columns_before:
            print("Adding column...", file=sys.stderr)
            # Force add the column
            cursor.execute("ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'")
            print("Column added!", file=sys.stderr)
            
            # Update existing rows
            cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
            print("Updated existing records", file=sys.stderr)
        else:
            print("Column already exists", file=sys.stderr)
        
        # Verify
        cursor.execute("PRAGMA table_info(api_house)")
        columns_after = [row[1] for row in cursor.fetchall()]
        print(f"AFTER: {[col[1] for col in columns_after]}", file=sys.stderr)
        
        if 'listing_type' in [col[1] for col in columns_after]:
            print("SUCCESS!", file=sys.stderr)
            sys.exit(0)
        else:
            print("FAILED!", file=sys.stderr)
            sys.exit(1)
            
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

