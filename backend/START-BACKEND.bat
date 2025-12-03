@echo off
echo ========================================
echo Starting Django Backend Server
echo ========================================
echo.

cd /d "%~dp0"

REM Use system Python to avoid virtual environment issues
set PYTHON_PATH=C:\Users\Patotoy\AppData\Local\Programs\Python\Python39\python.exe

echo Checking Python...
%PYTHON_PATH% --version
if errorlevel 1 (
    echo ERROR: Python not found at %PYTHON_PATH%!
    echo Trying system Python...
    python --version
    if errorlevel 1 (
        echo ERROR: Python not found!
        echo Please install Python or add it to PATH
        pause
        exit /b 1
    )
    set PYTHON_PATH=python
)

echo.
echo Checking if Django is installed...
%PYTHON_PATH% -c "import django" 2>nul
if errorlevel 1 (
    echo Django not found. Installing dependencies...
    echo This may take a few minutes...
    %PYTHON_PATH% -m pip install --upgrade pip
    %PYTHON_PATH% -m pip install django djangorestframework django-cors-headers djangorestframework-simplejwt django-simple-history
    echo.
)

echo.
echo Starting Django server on http://localhost:8000...
echo Press Ctrl+C to stop the server
echo.

%PYTHON_PATH% manage.py runserver

pause

