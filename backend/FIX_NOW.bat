@echo off
echo ========================================
echo FIXING listing_type column issue
echo ========================================
echo.
cd /d %~dp0
echo Current directory: %CD%
echo.
echo Step 1: Adding listing_type column...
python -c "import os; os.environ['DJANGO_SETTINGS_MODULE']='core.settings'; import django; django.setup(); from django.db import connection; c=connection.cursor(); c.execute('PRAGMA table_info(api_house)'); cols=[r[1] for r in c.fetchall()]; print('Current columns:', cols); 'listing_type' not in cols and (c.execute('ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT \"sale\"'), connection.commit(), print('SUCCESS: Column added!')) or print('Column already exists'); c.execute('PRAGMA table_info(api_house)'); print('Final columns:', [r[1] for r in c.fetchall()])"
echo.
echo Step 2: Marking migration as applied...
python manage.py migrate api 0048 --fake
echo.
echo ========================================
echo DONE! Please restart your Django server.
echo ========================================
pause

