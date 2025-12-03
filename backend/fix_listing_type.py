#!/usr/bin/env python
"""Script to add listing_type column to api_house table"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection
from django.core.management import call_command

def add_listing_type_column():
    """Add listing_type column if it doesn't exist"""
    try:
        with connection.cursor() as cursor:
            # Check if column exists
            cursor.execute("PRAGMA table_info(api_house)")
            columns = [row[1] for row in cursor.fetchall()]
            
            print(f"Current columns: {columns}")
            
            if 'listing_type' not in columns:
                print("Adding listing_type column to api_house table...")
                try:
                    cursor.execute("""
                        ALTER TABLE api_house 
                        ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'
                    """)
                    connection.commit()
                    print("✓ Successfully added listing_type column")
                    
                    # Mark migration as applied
                    print("Marking migration 0048 as applied...")
                    call_command('migrate', 'api', '0048', '--fake', verbosity=1)
                    print("✓ Migration marked as applied")
                except Exception as e:
                    print(f"✗ Error adding column: {e}")
                    sys.exit(1)
            else:
                print("✓ listing_type column already exists")
                
            # Verify
            cursor.execute("PRAGMA table_info(api_house)")
            columns_after = [row[1] for row in cursor.fetchall()]
            print(f"Columns after: {columns_after}")
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    add_listing_type_column()

