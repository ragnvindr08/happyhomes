"""
Quick test script to check if house images are being saved correctly
Run this with: python manage.py shell < test_house_images.py
Or: python manage.py shell, then copy-paste this code
"""
from api.models import House, HouseImage

# Get the most recent house
latest_house = House.objects.order_by('-created_at').first()

if latest_house:
    print(f"\n=== Testing House ID: {latest_house.id} ===")
    print(f"Title: {latest_house.title}")
    print(f"Created: {latest_house.created_at}")
    
    # Check images
    images = HouseImage.objects.filter(house=latest_house)
    print(f"\nImages in database: {images.count()}")
    
    for img in images:
        print(f"  - Image ID: {img.id}, Order: {img.order}")
        print(f"    File: {img.image.name if img.image else 'None'}")
        print(f"    URL: {img.image.url if img.image else 'None'}")
        if img.image:
            import os
            from django.conf import settings
            file_path = os.path.join(settings.MEDIA_ROOT, img.image.name)
            exists = os.path.exists(file_path)
            print(f"    File exists: {exists}")
            if exists:
                print(f"    File size: {os.path.getsize(file_path)} bytes")
    
    # Check relationship
    print(f"\nVia relationship: {latest_house.images.count()} images")
    for img in latest_house.images.all():
        print(f"  - {img.image.name if img.image else 'None'}")
else:
    print("No houses found in database")

