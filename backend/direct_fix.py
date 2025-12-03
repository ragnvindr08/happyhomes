#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Direct fix for listing_type column - MUST STOP DJANGO SERVER FIRST"""

import os
import sys

# Change to script directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    import django
    django.setup()
except Exception as e:
    print(f"ERROR: Cannot setup Django: {e}")
    print("\nMake sure you're in the backend directory and Django is installed.")
    sys.exit(1)

from django.db import connection, transaction

def main():
    print("\n" + "="*80)
    print("DIRECT FIX: Adding listing_type column to api_house table")
    print("="*80 + "\n")
    
    print("⚠️  IMPORTANT: Make sure Django server is STOPPED!\n")
    
    try:
        with connection.cursor() as cursor:
            # Check current state
            cursor.execute("PRAGMA table_info(api_house)")
            columns = [row[1] for row in cursor.fetchall()]
            print(f"📋 Current columns: {columns}\n")
            
            if 'listing_type' in columns:
                print("✅ Column 'listing_type' already exists!")
                print("✅ No action needed.\n")
                return True
            
            print("❌ Column 'listing_type' is MISSING!")
            print("🔧 Adding column now...\n")
            
            # Add the column
            try:
                cursor.execute("""
                    ALTER TABLE api_house 
                    ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'
                """)
                # SQLite auto-commits DDL, but let's be explicit
                try:
                    connection.commit()
                except:
                    pass
                print("✅ Column added successfully!")
            except Exception as sql_err:
                if 'duplicate column' in str(sql_err).lower() or 'already exists' in str(sql_err).lower():
                    print("✅ Column already exists (caught by error check)")
                else:
                    print(f"❌ SQL Error: {sql_err}")
                    raise
            
            # Update existing records
            try:
                cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
                try:
                    connection.commit()
                except:
                    pass
                print("✅ Updated existing records with default value")
            except Exception as update_err:
                print(f"⚠️  Warning updating records: {update_err}")
            
            # Verify
            cursor.execute("PRAGMA table_info(api_house)")
            columns_after = [row[1] for row in cursor.fetchall()]
            final_column_names = [col[1] for col in columns_after]
            print(f"\n📋 Final columns: {final_column_names}\n")
            
            if 'listing_type' in final_column_names:
                print("="*80)
                print("✅ SUCCESS! The listing_type column has been added.")
                print("="*80)
                print("\n📝 Next steps:")
                print("   1. Run: python manage.py migrate api 0048 --fake")
                print("   2. Restart your Django server: python manage.py runserver")
                print("\n")
                return True
            else:
                print("="*80)
                print("❌ ERROR: Column verification failed!")
                print("="*80 + "\n")
                return False
                
    except Exception as e:
        print("="*80)
        print(f"❌ FATAL ERROR: {e}")
        print("="*80 + "\n")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)

