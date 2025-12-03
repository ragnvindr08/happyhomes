from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Adds listing_type column to api_house table if it does not exist'

    def handle(self, *args, **options):
        self.stdout.write("=" * 70)
        self.stdout.write("Adding listing_type column to api_house table")
        self.stdout.write("=" * 70)
        
        try:
            with connection.cursor() as cursor:
                # Check current schema
                cursor.execute("PRAGMA table_info(api_house)")
                columns_before = [row[1] for row in cursor.fetchall()]
                self.stdout.write(f"\nCurrent columns: {columns_before}")
                
                if 'listing_type' in columns_before:
                    self.stdout.write(self.style.SUCCESS("\n✓ Column 'listing_type' already exists!"))
                    return
                
                self.stdout.write("\nColumn 'listing_type' is missing. Adding it now...")
                
                # Add the column
                cursor.execute("""
                    ALTER TABLE api_house 
                    ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale'
                """)
                connection.commit()
                self.stdout.write(self.style.SUCCESS("✓ Column added successfully!"))
                
                # Update existing records
                cursor.execute("UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL")
                connection.commit()
                self.stdout.write(self.style.SUCCESS("✓ Updated existing records"))
                
                # Verify
                cursor.execute("PRAGMA table_info(api_house)")
                columns_after = [row[1] for row in cursor.fetchall()]
                self.stdout.write(f"\nFinal columns: {[col[1] for col in columns_after]}")
                
                if 'listing_type' in [col[1] for col in columns_after]:
                    self.stdout.write(self.style.SUCCESS("\n" + "=" * 70))
                    self.stdout.write(self.style.SUCCESS("SUCCESS! Column has been added."))
                    self.stdout.write("=" * 70)
                    self.stdout.write("\nNow run: python manage.py migrate api 0048 --fake")
                else:
                    self.stdout.write(self.style.ERROR("\nERROR: Column was not added!"))
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\nERROR: {e}"))
            import traceback
            traceback.print_exc()
            raise

