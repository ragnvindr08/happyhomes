#!/usr/bin/env python
import os
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.db import connection

print("=" * 70)
print("FIXING: Adding listing_type column to api_house table")
print("=" * 70)

try:
    with connection.cursor() as cursor:
        # Check current schema
        cursor.execute("PRAGMA table_info(api_house)")
        columns_before = [row[1] for row in cursor.fetchall()]
        print(f"\nBEFORE - Current columns: {columns_before}")
        
        if 'listing_type' in columns_before:
            print("\n✓ Column 'listing_type' already exists!")
            print("No action needed.")
        else:
            print("\n✗ Column 'listing_type' is MISSING!")
            print("Adding column now...")
            
            # Add the column
            cursor.execute("""
                ALTER TABLE api_house 
                ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'
            """)
            
            # Commit the transaction
            connection.commit()
            print("✓ Column added successfully!")
            
            # Update existing records
            cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
            connection.commit()
            print("✓ Updated existing records with default value 'sale'")
        
        # Verify
        cursor.execute("PRAGMA table_info(api_house)")
        columns_after = [row[1] for row in cursor.fetchall()]
        print(f"\nAFTER - Final columns: {[col[1] for col in columns_after]}")
        
        if 'listing_type' in [col[1] for col in columns_after]:
            print("\n" + "=" * 70)
            print("✓ SUCCESS! The listing_type column has been added.")
            print("=" * 70)
            print("\nNext step: Mark migration as applied:")
            print("  python manage.py migrate api 0048 --fake")
            print("\nThen restart your Django server.")
        else:
            print("\n" + "=" * 70)
            print("✗ ERROR: Column was not added successfully!")
            print("=" * 70)
            sys.exit(1)
            
except Exception as e:
    print("\n" + "=" * 70)
    print(f"✗ ERROR: {e}")
    print("=" * 70)
    import traceback
    traceback.print_exc()
    sys.exit(1)

