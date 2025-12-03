# Quick Fix for listing_type Column Error

## The Problem
The `api_house` table is missing the `listing_type` column, causing an OperationalError.

## Solution

### Option 1: Using Django Shell (Recommended)

1. Open a terminal in the `backend` directory
2. Run: `python manage.py shell`
3. Paste and execute this code:

```python
from django.db import connection

cursor = connection.cursor()

# Check current columns
cursor.execute("PRAGMA table_info(api_house)")
columns = [row[1] for row in cursor.fetchall()]
print("Current columns:", columns)

# Add the column if it doesn't exist
if 'listing_type' not in columns:
    cursor.execute("ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'")
    print("✓ Column added!")
    
    # Update existing records
    cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
    print("✓ Existing records updated!")
else:
    print("✓ Column already exists")

# Verify
cursor.execute("PRAGMA table_info(api_house)")
columns_after = [row[1] for row in cursor.fetchall()]
print("Final columns:", [col[1] for col in columns_after])
```

4. Mark the migration as applied:
```bash
python manage.py migrate api 0048 --fake
```

### Option 2: Using SQLite directly

1. Navigate to the backend directory
2. Open the database: `sqlite3 db.sqlite3`
3. Run: `ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale';`
4. Run: `UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL;`
5. Exit: `.quit`
6. Mark migration: `python manage.py migrate api 0048 --fake`

### Option 3: Run the Python script

```bash
cd backend
python add_listing_type.py
python manage.py migrate api 0048 --fake
```

After any of these methods, restart your Django server and the error should be fixed!

