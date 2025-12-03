import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection, transaction
from django.core.management import call_command

print("=" * 50)
print("Applying migration for listing_type column")
print("=" * 50)

try:
    with connection.cursor() as cursor:
        # Check current columns
        cursor.execute("PRAGMA table_info(api_house)")
        columns_before = [row[1] for row in cursor.fetchall()]
        print(f"\nColumns before: {columns_before}")
        
        if 'listing_type' not in columns_before:
            print("\nColumn 'listing_type' not found. Adding it...")
            
            with transaction.atomic():
                cursor.execute("""
                    ALTER TABLE api_house 
                    ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'
                """)
                print("✓ Column added successfully")
        else:
            print("\n✓ Column 'listing_type' already exists")
        
        # Verify
        cursor.execute("PRAGMA table_info(api_house)")
        columns_after = [row[1] for row in cursor.fetchall()]
        print(f"\nColumns after: {columns_after}")
        
        # Mark migration as applied
        print("\nMarking migration 0048 as applied...")
        call_command('migrate', 'api', '0048', '--fake', verbosity=1)
        print("✓ Migration 0048 marked as applied")
        
        print("\n" + "=" * 50)
        print("SUCCESS: Migration applied!")
        print("=" * 50)
        
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

