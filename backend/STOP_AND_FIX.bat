@echo off
echo ============================================================
echo IMPORTANT: Stop your Django server first (Ctrl+C)
echo ============================================================
echo.
echo Press any key after stopping the server to continue...
pause
echo.
echo ============================================================
echo Step 1: Adding listing_type column to database...
echo ============================================================
cd /d %~dp0
python fix_column.py
echo.
echo ============================================================
echo Step 2: Marking migration as applied...
echo ============================================================
python manage.py migrate api 0048 --fake
echo.
echo ============================================================
echo Step 3: Verifying the fix...
echo ============================================================
python verify_fix.py
echo.
echo ============================================================
echo DONE! Now restart your Django server.
echo ============================================================
pause

