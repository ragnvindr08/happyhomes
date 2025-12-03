import os
import sys

print("STOP YOUR DJANGO SERVER FIRST (Ctrl+C), then press Enter...")
input()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from django.db import connection

print("\n" + "="*70)
print("ADDING listing_type COLUMN")
print("="*70 + "\n")

with connection.cursor() as cursor:
    cursor.execute("PRAGMA table_info(api_house)")
    cols = [r[1] for r in cursor.fetchall()]
    print(f"Current: {cols}\n")
    
    if 'listing_type' not in cols:
        print("Adding column...")
        cursor.execute("ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'")
        cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
        print("✓ Done!\n")
    else:
        print("✓ Already exists!\n")
    
    cursor.execute("PRAGMA table_info(api_house)")
    print(f"Final: {[r[1] for r in cursor.fetchall()]}\n")

print("Now run: python manage.py migrate api 0048 --fake")
print("Then restart your server!")

