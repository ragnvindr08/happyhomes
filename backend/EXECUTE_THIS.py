"""
EXECUTE THIS SCRIPT TO FIX THE listing_type COLUMN ERROR

IMPORTANT: Stop your Django server first (Ctrl+C in the terminal where it's running)

Then run: python EXECUTE_THIS.py
"""

import os
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    import django
    django.setup()
except Exception as e:
    print(f"ERROR setting up Django: {e}")
    sys.exit(1)

from django.db import connection

print("\n" + "="*70)
print("FIXING: Adding listing_type column to api_house table")
print("="*70 + "\n")

try:
    with connection.cursor() as cursor:
        # Check current columns
        cursor.execute("PRAGMA table_info(api_house)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Current columns: {columns}\n")
        
        if 'listing_type' in columns:
            print("✓ Column 'listing_type' already exists!")
            print("No action needed.\n")
        else:
            print("✗ Column 'listing_type' is MISSING!")
            print("Adding column now...\n")
            
            try:
                # Add column
                cursor.execute("""
                    ALTER TABLE api_house 
                    ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'
                """)
                print("✓ Column added!")
                
                # Update existing records
                cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
                print("✓ Updated existing records\n")
            except Exception as sql_err:
                print(f"✗ SQL Error: {sql_err}\n")
                raise
        
        # Verify
        cursor.execute("PRAGMA table_info(api_house)")
        final_columns = [row[1] for row in cursor.fetchall()]
        print(f"Final columns: {final_columns}\n")
        
        if 'listing_type' in final_columns:
            print("="*70)
            print("✓ SUCCESS! Column has been added.")
            print("="*70)
            print("\nNext steps:")
            print("1. Run: python manage.py migrate api 0048 --fake")
            print("2. Restart your Django server\n")
        else:
            print("="*70)
            print("✗ ERROR: Column was not added!")
            print("="*70 + "\n")
            sys.exit(1)
            
except Exception as e:
    print("="*70)
    print(f"✗ ERROR: {e}")
    print("="*70 + "\n")
    import traceback
    traceback.print_exc()
    sys.exit(1)

