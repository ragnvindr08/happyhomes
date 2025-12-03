#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.db import connection

def main():
    log_file = open('fix_db_log.txt', 'w')
    
    def log(msg):
        print(msg)
        log_file.write(msg + '\n')
        log_file.flush()
    
    log("=" * 60)
    log("Fixing listing_type column in api_house table")
    log("=" * 60)
    
    try:
        with connection.cursor() as cursor:
            # Get current table structure
            cursor.execute("PRAGMA table_info(api_house)")
            columns = cursor.fetchall()
            
            column_names = [col[1] for col in columns]
            log(f"\nCurrent columns in api_house: {column_names}")
            
            if 'listing_type' in column_names:
                log("\n✓ listing_type column already exists!")
                log_file.close()
                return 0
            
            log("\nAdding listing_type column...")
            cursor.execute("""
                ALTER TABLE api_house 
                ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'
            """)
            connection.commit()
            
            # Verify it was added
            cursor.execute("PRAGMA table_info(api_house)")
            columns_after = cursor.fetchall()
            column_names_after = [col[1] for col in columns_after]
            log(f"\nColumns after: {column_names_after}")
            
            if 'listing_type' in column_names_after:
                log("\n✓ SUCCESS: listing_type column added!")
                
                # Update existing records to have default value
                cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
                connection.commit()
                log("✓ Updated existing records with default value")
                
                log("\n" + "=" * 60)
                log("MIGRATION COMPLETE!")
                log("=" * 60)
                log_file.close()
                return 0
            else:
                log("\n✗ ERROR: Column was not added!")
                log_file.close()
                return 1
                
    except Exception as e:
        log(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc(file=log_file)
        log_file.close()
        return 1

if __name__ == '__main__':
    sys.exit(main())

