#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate --settings=core.deployment_settings

# Collect static files
python manage.py collectstatic --noinput --settings=core.deployment_settings
