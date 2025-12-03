# Backend Server Startup Guide

## Problem
Your virtual environment is broken because it references a Python path from another user's machine (`C:\Users\BRIX\...`).

## Solution Options

### Option 1: Fix Virtual Environment (Recommended)
Run the `FIX-AND-RUN.bat` file. This will:
1. Remove the broken virtual environment
2. Create a new one
3. Install all required dependencies
4. Start the server

**Just double-click `FIX-AND-RUN.bat`**

### Option 2: Manual Fix
If you prefer to do it manually:

```powershell
# Navigate to backend directory
cd "Capstone Final\happy_homes\backend"

# Remove old virtual environment
Remove-Item -Recurse -Force env

# Create new virtual environment
python -m venv env

# Activate it
.\env\Scripts\activate

# Install dependencies
pip install django djangorestframework django-cors-headers djangorestframework-simplejwt django-simple-history

# Run server
python manage.py runserver
```

### Option 3: Use System Python (Quick Fix)
If you just want to test quickly, you can use system Python (but you'll need to install dependencies):

```powershell
cd "Capstone Final\happy_homes\backend"
C:\Users\Patotoy\AppData\Local\Programs\Python\Python39\python.exe manage.py runserver
```

## After Server Starts

The backend will be available at:
- **http://localhost:8000**
- **http://127.0.0.1:8000**

Your frontend (running on port 3000) is already configured to connect to this backend.

## Troubleshooting

If you get "ModuleNotFoundError":
- Make sure the virtual environment is activated
- Run `pip install -r requirements.txt` (if you have one) or install packages manually

If you get port already in use:
- Stop any other Django servers running
- Or use a different port: `python manage.py runserver 8001`

