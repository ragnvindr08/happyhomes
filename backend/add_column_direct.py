import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.db import connection

print("="*70)
print("ADDING listing_type COLUMN TO DATABASE")
print("="*70)

try:
    with connection.cursor() as cursor:
        # Check current columns
        cursor.execute("PRAGMA table_info(api_house)")
        columns_before = [row[1] for row in cursor.fetchall()]
        print(f"\nCurrent columns: {columns_before}")
        
        if 'listing_type' not in columns_before:
            print("\nAdding listing_type column...")
            cursor.execute("ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'")
            print("✓ Column added!")
            
            # Update existing records
            cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
            print("✓ Updated existing records")
        else:
            print("\n✓ Column already exists")
        
        # Verify
        cursor.execute("PRAGMA table_info(api_house)")
        columns_after = [row[1] for row in cursor.fetchall()]
        final_cols = [col[1] for col in columns_after]
        print(f"\nFinal columns: {final_cols}")
        
        if 'listing_type' in final_cols:
            print("\n" + "="*70)
            print("✓ SUCCESS! Column has been added to the database.")
            print("="*70)
            sys.exit(0)
        else:
            print("\n✗ ERROR: Column was not added!")
            sys.exit(1)
            
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

