import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection, transaction

# Open log file
log = open('migration_log.txt', 'w', encoding='utf-8')

def output(msg):
    print(msg)
    log.write(msg + '\n')
    log.flush()

output("=" * 60)
output("Adding listing_type column to api_house table")
output("=" * 60)

try:
    with connection.cursor() as cursor:
        # Check if column exists
        cursor.execute("PRAGMA table_info(api_house)")
        columns = [row[1] for row in cursor.fetchall()]
        output(f"\nCurrent columns: {columns}")
        
        if 'listing_type' not in columns:
            output("\nColumn doesn't exist. Adding it now...")
            try:
                cursor.execute("ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'")
                connection.commit()
                output("✓ Column added successfully!")
                
                # Update existing rows
                cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
                connection.commit()
                output("✓ Updated existing records")
            except Exception as sql_error:
                output(f"✗ SQL Error: {sql_error}")
                raise
        else:
            output("\n✓ Column already exists")
        
        # Verify
        cursor.execute("PRAGMA table_info(api_house)")
        columns_after = [row[1] for row in cursor.fetchall()]
        output(f"\nFinal columns: {[col[1] for col in columns_after]}")
        
        if 'listing_type' in [col[1] for col in columns_after]:
            output("\n" + "=" * 60)
            output("SUCCESS! Column has been added.")
            output("=" * 60)
            output("\nNow run: python manage.py migrate api 0048 --fake")
        else:
            output("\n✗ ERROR: Column was not added!")
            
except Exception as e:
    output(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc(file=log)
    log.close()
    sys.exit(1)

log.close()

