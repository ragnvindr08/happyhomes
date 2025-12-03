@echo off
echo ========================================
echo Fixing Backend Virtual Environment
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Removing old broken virtual environment...
if exist env rmdir /s /q env

echo.
echo Step 2: Creating new virtual environment...
python -m venv env
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment!
    echo Make sure Python is installed and in PATH
    pause
    exit /b 1
)

echo.
echo Step 3: Activating virtual environment...
call env\Scripts\activate.bat

echo.
echo Step 4: Installing dependencies...
echo This may take a few minutes...
pip install --upgrade pip
pip install django djangorestframework django-cors-headers djangorestframework-simplejwt django-simple-history

echo.
echo ========================================
echo Virtual environment fixed!
echo ========================================
echo.
echo Step 5: Starting Django server...
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver

pause

