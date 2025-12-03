# Backend Server Startup Script
# This script fixes the PowerShell execution policy and starts the Django server
# Run this script from the backend directory

# Bypass execution policy for this session (must be first)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Activate virtual environment
& .\env\Scripts\Activate.ps1

# Start Django development server
python manage.py runserver

