# Backend Server Startup Script
# Run this from the backend directory

Write-Host "Starting Django Backend Server..." -ForegroundColor Green

# Bypass execution policy for this session
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\env\Scripts\Activate.ps1

# Start Django development server
Write-Host "Starting Django server on http://localhost:8000..." -ForegroundColor Yellow
python manage.py runserver

