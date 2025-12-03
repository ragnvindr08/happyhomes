# FIX: listing_type Column Error

## The Problem
The `api_house` table is missing the `listing_type` column, causing this error:
```
OperationalError: no such column: api_house.listing_type
```

## Solution (3 Simple Steps)

### ⚠️ IMPORTANT: Stop your Django server first!
Press `Ctrl+C` in the terminal where Django is running.

### Step 1: Run the fix script
```bash
cd backend
python fix_column.py
```

### Step 2: Mark migration as applied
```bash
python manage.py migrate api 0048 --fake
```

### Step 3: Restart Django server
```bash
python manage.py runserver
```

---

## Alternative: Manual Fix via Django Shell

If the script doesn't work, use Django shell:

1. **Stop Django server** (Ctrl+C)

2. **Open Django shell:**
   ```bash
   cd backend
   python manage.py shell
   ```

3. **Run this code:**
   ```python
   from django.db import connection
   
   cursor = connection.cursor()
   
   # Check if column exists
   cursor.execute("PRAGMA table_info(api_house)")
   columns = [row[1] for row in cursor.fetchall()]
   print("Current columns:", columns)
   
   # Add column if missing
   if 'listing_type' not in columns:
       cursor.execute("ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'")
       cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
       print("✓ Column added!")
   else:
       print("✓ Column already exists")
   
   # Verify
   cursor.execute("PRAGMA table_info(api_house)")
   print("Final columns:", [row[1] for row in cursor.fetchall()])
   ```

4. **Exit shell** (type `exit()`)

5. **Mark migration:**
   ```bash
   python manage.py migrate api 0048 --fake
   ```

6. **Restart server:**
   ```bash
   python manage.py runserver
   ```

---

## Quick Batch File (Windows)

Double-click `STOP_AND_FIX.bat` in the backend folder (after stopping Django server).

---

## Verification

After fixing, verify it worked:
```bash
python verify_fix.py
```

If you see "SUCCESS: listing_type column exists!", you're done!

