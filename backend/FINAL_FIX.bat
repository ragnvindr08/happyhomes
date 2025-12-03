@echo off
echo ============================================
echo FINAL FIX for listing_type column
echo ============================================
echo.
cd /d %~dp0

echo Step 1: Adding column directly...
python -c "import os; os.environ['DJANGO_SETTINGS_MODULE']='core.settings'; import django; django.setup(); from django.db import connection; c=connection.cursor(); c.execute('PRAGMA table_info(api_house)'); cols=[r[1] for r in c.fetchall()]; print('BEFORE:', cols); 'listing_type' not in cols and (c.execute('ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT \"sale\"'), print('ADDED!')) or print('EXISTS'); c.execute('PRAGMA table_info(api_house)'); print('AFTER:', [r[1] for r in c.fetchall()])"

echo.
echo Step 2: Marking migrations as applied...
python manage.py migrate api 0048 --fake
python manage.py migrate api 0049 --fake

echo.
echo Step 3: Verifying...
python -c "import os; os.environ['DJANGO_SETTINGS_MODULE']='core.settings'; import django; django.setup(); from django.db import connection; c=connection.cursor(); c.execute('PRAGMA table_info(api_house)'); cols=[r[1] for r in c.fetchall()]; print('VERIFICATION - listing_type exists:', 'listing_type' in cols)"

echo.
echo ============================================
echo DONE! Restart your Django server.
echo ============================================
pause

