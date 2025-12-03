@echo off
REM Backend Server Startup Script
REM Run this from the backend directory

REM Bypass execution policy and activate virtual environment
powershell -ExecutionPolicy Bypass -Command "& {Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force; .\env\Scripts\activate; python manage.py runserver}"

