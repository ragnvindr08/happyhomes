import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.db import connection

result_file = open('fix_result.txt', 'w')

def log(msg):
    print(msg)
    result_file.write(str(msg) + '\n')
    result_file.flush()

log("="*70)
log("FIXING listing_type COLUMN")
log("="*70)

try:
    with connection.cursor() as cursor:
        # Check before
        cursor.execute("PRAGMA table_info(api_house)")
        cols_before = [r[1] for r in cursor.fetchall()]
        log(f"\nBEFORE: {cols_before}")
        
        if 'listing_type' not in cols_before:
            log("\nAdding column...")
            try:
                cursor.execute("ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'")
                log("✓ Column SQL executed")
                
                # Update existing
                cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
                log("✓ Updated existing records")
            except Exception as e:
                log(f"✗ Error: {e}")
                raise
        else:
            log("\n✓ Column already exists")
        
        # Verify
        cursor.execute("PRAGMA table_info(api_house)")
        cols_after = [r[1] for r in cursor.fetchall()]
        log(f"\nAFTER: {[r[1] for r in cols_after]}")
        
        if 'listing_type' in [r[1] for r in cols_after]:
            log("\n" + "="*70)
            log("✓ SUCCESS! Column added!")
            log("="*70)
        else:
            log("\n✗ FAILED - Column not found")
            
except Exception as e:
    log(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc(file=result_file)

result_file.close()

