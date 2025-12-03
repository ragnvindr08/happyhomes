#!/usr/bin/env python
"""Fix the listing_type column issue"""
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.db import connection

def main():
    print("\n" + "="*70)
    print("FIXING: Adding listing_type column to api_house table")
    print("="*70 + "\n")
    
    try:
        with connection.cursor() as cursor:
            # Check current state
            cursor.execute("PRAGMA table_info(api_house)")
            columns = [row[1] for row in cursor.fetchall()]
            print(f"Current columns: {columns}\n")
            
            if 'listing_type' in columns:
                print("✓ Column 'listing_type' already exists!")
                return True
            
            print("✗ Column 'listing_type' is MISSING!")
            print("Adding column now...\n")
            
            # Add the column
            try:
                cursor.execute("""
                    ALTER TABLE api_house 
                    ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'
                """)
                print("✓ Column added successfully!")
            except Exception as e:
                if 'duplicate' in str(e).lower() or 'already exists' in str(e).lower():
                    print("✓ Column already exists (caught by error check)")
                else:
                    print(f"✗ Error adding column: {e}")
                    raise
            
            # Update existing records
            try:
                cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
                print("✓ Updated existing records")
            except Exception as e:
                print(f"⚠ Warning updating records: {e}")
            
            # Verify
            cursor.execute("PRAGMA table_info(api_house)")
            columns_after = [row[1] for row in cursor.fetchall()]
            final_cols = [col[1] for col in columns_after]
            print(f"\nFinal columns: {final_cols}\n")
            
            if 'listing_type' in final_cols:
                print("="*70)
                print("✓ SUCCESS! Column has been added.")
                print("="*70)
                return True
            else:
                print("="*70)
                print("✗ ERROR: Column verification failed!")
                print("="*70)
                return False
                
    except Exception as e:
        print("="*70)
        print(f"✗ FATAL ERROR: {e}")
        print("="*70)
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    if success:
        print("\n✓ Database fix complete!")
        print("Now restart your Django server.\n")
    else:
        print("\n✗ Fix failed. Check the error above.\n")
        sys.exit(1)

