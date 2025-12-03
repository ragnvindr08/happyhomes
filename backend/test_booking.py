"""
Quick test script to check booking creation
Run this from the backend directory: python test_booking.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Facility, Booking, User
from django.utils import timezone
from datetime import date, time, timedelta

# Check if facilities exist
facilities = Facility.objects.all()
print(f"Facilities in database: {list(facilities.values('id', 'name'))}")

if not facilities.exists():
    print("No facilities found! Creating default facilities...")
    Facility.objects.create(name="Court")
    Facility.objects.create(name="Pool")
    Facility.objects.create(name="Clubhouse")
    print("Default facilities created!")

# Check if there are any users
users = User.objects.all()
print(f"Users in database: {users.count()}")

# Check recent bookings
recent_bookings = Booking.objects.all()[:5]
print(f"Recent bookings: {list(recent_bookings.values('id', 'facility_id', 'date', 'status'))}")

print("\n✅ Database check complete!")



