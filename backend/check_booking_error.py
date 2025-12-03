"""
Quick script to test booking creation and see what error occurs
Run: python check_booking_error.py
"""
import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Facility, Booking, User
from api.serializers import BookingSerializer
from rest_framework.test import APIRequestFactory
from rest_framework import status
from django.utils import timezone
from datetime import date, time

# Get a test user
user = User.objects.first()
if not user:
    print("No users found! Please create a user first.")
    sys.exit(1)

# Get a facility
facility = Facility.objects.first()
if not facility:
    print("No facilities found! Creating default facilities...")
    facility = Facility.objects.create(name="Court")
    print(f"Created facility: {facility.id} - {facility.name}")

print(f"Testing with user: {user.username} (staff: {user.is_staff})")
print(f"Testing with facility: {facility.id} - {facility.name}")

# Create test data
test_data = {
    'facility_id': facility.id,
    'date': '2025-12-01',
    'start_time': '10:00',
    'end_time': '11:00'
}

print(f"\nTest data: {test_data}")

# Create a request factory
factory = APIRequestFactory()

# Create a request
request = factory.post('/api/bookings/', test_data, format='json')

# Manually set the user (simulating authentication)
request.user = user

# Try to create serializer
try:
    serializer = BookingSerializer(data=test_data, context={'request': request})
    print(f"\nSerializer created")
    
    if serializer.is_valid():
        print(f"Serializer is valid: {serializer.validated_data}")
        try:
            booking = serializer.save(user=user)
            print(f"✅ Booking created successfully! ID: {booking.id}")
        except Exception as e:
            print(f"❌ Error saving booking: {e}")
            import traceback
            traceback.print_exc()
    else:
        print(f"❌ Serializer is invalid: {serializer.errors}")
except Exception as e:
    print(f"❌ Error creating serializer: {e}")
    import traceback
    traceback.print_exc()



