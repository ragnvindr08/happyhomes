# PowerShell script to start Django server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Django Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to backend directory
Set-Location $PSScriptRoot

# Fix database first
Write-Host "Step 1: Fixing database..." -ForegroundColor Yellow
python FIX_DATABASE.py

Write-Host ""
Write-Host "Step 2: Starting Django server on port 8000..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:8000/" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start server
python manage.py runserver 8000

