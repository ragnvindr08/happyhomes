#!/usr/bin/env python
import os
import sys

# Ensure we're in the right directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    import django
    django.setup()
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)

from django.db import connection

# Write to both stdout and file
output_file = open('fix_output.txt', 'w')

def output(msg):
    print(msg)
    output_file.write(str(msg) + '\n')
    output_file.flush()

output("="*70)
output("FIXING listing_type COLUMN")
output("="*70)

try:
    with connection.cursor() as cursor:
        # Check current state
        cursor.execute("PRAGMA table_info(api_house)")
        columns = [row[1] for row in cursor.fetchall()]
        output(f"\nCurrent columns: {columns}")
        
        if 'listing_type' in columns:
            output("\n✓ Column already exists!")
        else:
            output("\n✗ Column missing - adding now...")
            cursor.execute("ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'")
            output("✓ Column added!")
            
            cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
            output("✓ Updated existing records")
        
        # Final verification
        cursor.execute("PRAGMA table_info(api_house)")
        final_cols = [row[1] for row in cursor.fetchall()]
        output(f"\nFinal columns: {final_cols}")
        
        if 'listing_type' in final_cols:
            output("\n" + "="*70)
            output("✓ SUCCESS!")
            output("="*70)
        else:
            output("\n✗ FAILED")
            
except Exception as e:
    output(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc(file=output_file)

output_file.close()

