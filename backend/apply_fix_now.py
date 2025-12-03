import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.db import connection
from django.core.management import call_command

print("="*70)
print("APPLYING FIX FOR listing_type COLUMN")
print("="*70)

# Step 1: Add column if missing
with connection.cursor() as cursor:
    cursor.execute("PRAGMA table_info(api_house)")
    cols = [r[1] for r in cursor.fetchall()]
    print(f"Current columns: {cols}")
    
    if 'listing_type' not in cols:
        print("Adding listing_type column...")
        cursor.execute("ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'")
        cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
        print("✓ Column added and records updated")
    else:
        print("✓ Column already exists")

# Step 2: Mark migrations as applied
print("\nMarking migrations as applied...")
try:
    call_command('migrate', 'api', '0048', '--fake', verbosity=0)
    print("✓ Migration 0048 marked")
except:
    pass

try:
    call_command('migrate', 'api', '0049', '--fake', verbosity=0)
    print("✓ Migration 0049 marked")
except:
    pass

# Step 3: Verify
with connection.cursor() as cursor:
    cursor.execute("PRAGMA table_info(api_house)")
    final_cols = [r[1] for r in cursor.fetchall()]
    print(f"\nFinal columns: {final_cols}")
    
    if 'listing_type' in final_cols:
        print("\n" + "="*70)
        print("✓ SUCCESS! Column is now in database.")
        print("="*70)
        print("\nThe admin error should be fixed now.")
        print("Restart your Django server to see the changes.")
    else:
        print("\n✗ ERROR: Column still missing!")

