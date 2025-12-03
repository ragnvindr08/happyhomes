from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from api.models import Pin, Facility, Booking


# Auto-create default facilities when a Pin is added
@receiver(post_save, sender=Pin)
def create_default_facilities(sender, instance, created, **kwargs):
    if created:
        # Only create facilities if they don't already exist
        if not Facility.objects.filter(name="Court").exists():
            Facility.objects.create(name="Court")
        if not Facility.objects.filter(name="Pool").exists():
            Facility.objects.create(name="Pool")

# Log booking creation
@receiver(post_save, sender=Booking)
def notify_booking_created(sender, instance, created, **kwargs):
    if created:
        try:
            facility_name = instance.facility.get_name_display() if hasattr(instance, 'facility') and instance.facility else "Unknown"
            print(f"[INFO] New booking: {instance.user.username} booked {facility_name}")
        except Exception as e:
            print(f"[INFO] New booking created (ID: {instance.id})")

# Log booking deletion - completely safe, no relationship access
@receiver(post_delete, sender=Booking)
def notify_booking_deleted(sender, instance, **kwargs):
    """Safely log booking deletion without accessing relationships"""
    try:
        booking_id = getattr(instance, 'id', 'N/A')
        user_id = getattr(instance, 'user_id', None)
        facility_id = getattr(instance, 'facility_id', None)
        print(f"[INFO] Booking deleted (ID: {booking_id}, User ID: {user_id}, Facility ID: {facility_id})")
    except Exception as e:
        # Even if getting attributes fails, just log the deletion
        print(f"[INFO] Booking deleted (error getting details: {e})")
