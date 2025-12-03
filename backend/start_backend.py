#!/usr/bin/env python
"""Start Django server with database fix"""
import os
import sys
import subprocess

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.db import connection

print("\n" + "="*70)
print("STARTING DJANGO SERVER")
print("="*70 + "\n")

# Step 1: Fix database
print("Step 1: Checking database...")
try:
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(api_house)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'listing_type' not in columns:
            print("  Adding listing_type column...")
            cursor.execute("ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'")
            cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
            print("  ✓ Column added!")
        else:
            print("  ✓ Column already exists")
except Exception as e:
    print(f"  ⚠ Warning: {e}")

# Step 2: Mark migrations
print("\nStep 2: Marking migrations...")
try:
    from django.core.management import call_command
    call_command('migrate', 'api', '0048', '--fake', verbosity=0)
    call_command('migrate', 'api', '0049', '--fake', verbosity=0)
    print("  ✓ Migrations marked")
except:
    pass

# Step 3: Start server
print("\nStep 3: Starting Django server...")
print("="*70)
print("Server will be available at: http://localhost:8000/")
print("Press Ctrl+C to stop the server")
print("="*70 + "\n")

try:
    from django.core.management import execute_from_command_line
    execute_from_command_line(['manage.py', 'runserver', '8000'])
except KeyboardInterrupt:
    print("\n\nServer stopped.")
except Exception as e:
    print(f"\n✗ Error starting server: {e}")
    sys.exit(1)

