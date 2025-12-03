# Run Backend Server (Using System Python)
# This script bypasses the broken virtual environment

Write-Host "Starting Django Backend Server..." -ForegroundColor Green
Write-Host ""

# Navigate to backend directory
Set-Location $PSScriptRoot

# Deactivate virtual environment if active
if ($env:VIRTUAL_ENV) {
    Write-Host "Deactivating virtual environment..." -ForegroundColor Yellow
    deactivate
}

# Use system Python
$pythonPath = "C:\Users\Patotoy\AppData\Local\Programs\Python\Python39\python.exe"

# Check if system Python exists, otherwise use default
if (-not (Test-Path $pythonPath)) {
    Write-Host "System Python not found at $pythonPath" -ForegroundColor Yellow
    Write-Host "Using default Python..." -ForegroundColor Yellow
    $pythonPath = "python"
}

Write-Host "Using Python: $pythonPath" -ForegroundColor Cyan
Write-Host ""

# Check if Django is installed
Write-Host "Checking Django installation..." -ForegroundColor Yellow
& $pythonPath -c "import django; print('Django version:', django.get_version())" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Django not found. Installing dependencies..." -ForegroundColor Yellow
    & $pythonPath -m pip install --upgrade pip
    & $pythonPath -m pip install django djangorestframework django-cors-headers djangorestframework-simplejwt django-simple-history
    Write-Host ""
}

Write-Host "Starting Django server on http://localhost:8000..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
& $pythonPath manage.py runserver

