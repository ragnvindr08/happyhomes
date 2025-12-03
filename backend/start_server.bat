@echo off
echo ========================================
echo Starting Django Server
echo ========================================
echo.
cd /d %~dp0

echo Step 1: Fixing database...
python FIX_DATABASE.py

echo.
echo Step 2: Starting server...
python manage.py runserver 8000

pause
