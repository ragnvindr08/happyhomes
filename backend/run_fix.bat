@echo off
echo Applying listing_type migration...
cd /d %~dp0
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings'); import django; django.setup(); from django.db import connection; cursor = connection.cursor(); cursor.execute('PRAGMA table_info(api_house)'); cols = [r[1] for r in cursor.fetchall()]; print('Current columns:', cols); exec('listing_type' not in cols) and cursor.execute('ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT \"sale\"') or print('Column exists'); cursor.execute('PRAGMA table_info(api_house)'); print('Columns after:', [r[1] for r in cursor.fetchall()])"
python manage.py migrate api 0048 --fake
echo Done!
pause

