#!/bin/bash
# build.sh - Backend only (Django) for Render deployment
set -o errexit


# -----------------------
# 1. Install Python dependencies

pip install -r requirements.txt

# -----------------------
# 2. Collect Django static files
echo "🗂 Collecting Django static files..."
python manage.py collectstatic --noinput
python manage.py migrate

echo "✅ Django backend build completed!"
