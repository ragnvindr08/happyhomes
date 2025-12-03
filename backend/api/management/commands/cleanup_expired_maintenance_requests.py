from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, datetime
from api.models import MaintenanceRequest


class Command(BaseCommand):
    help = 'Deletes maintenance requests where preferred date/time has passed by more than 24 hours'

    def handle(self, *args, **options):
        self.stdout.write("=" * 70)
        self.stdout.write("Cleaning up expired maintenance requests")
        self.stdout.write("=" * 70)
        
        now = timezone.now()
        deleted_count = 0
        
        # Get all maintenance requests
        all_requests = MaintenanceRequest.objects.all()
        
        for request in all_requests:
            try:
                # Combine preferred_date and preferred_time into a datetime
                # Create a naive datetime first
                naive_datetime = datetime.combine(request.preferred_date, request.preferred_time)
                
                # Make it timezone-aware using the default timezone (from settings)
                preferred_datetime = timezone.make_aware(naive_datetime)
                
                # Check if preferred datetime has passed
                if preferred_datetime < now:
                    # Calculate time difference
                    time_diff = now - preferred_datetime
                    
                    # If more than 24 hours have passed, delete the request
                    if time_diff > timedelta(hours=24):
                        self.stdout.write(
                            f"Deleting request #{request.id} - "
                            f"{request.get_maintenance_type_display()} "
                            f"(preferred: {request.preferred_date} {request.preferred_time}, "
                            f"passed by: {str(time_diff).split('.')[0]})"
                        )
                        request.delete()
                        deleted_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(
                        f"Error processing request #{request.id}: {str(e)}"
                    )
                )
                continue
        
        if deleted_count == 0:
            self.stdout.write(self.style.SUCCESS("\n✓ No expired requests to delete"))
        else:
            self.stdout.write(
                self.style.SUCCESS(f"\n✓ Successfully deleted {deleted_count} expired request(s)")
            )
        
        self.stdout.write("=" * 70)

