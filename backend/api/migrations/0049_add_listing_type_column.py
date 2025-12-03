# Generated manually to fix listing_type column issue

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0048_house_listing_type'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE api_house ADD COLUMN listing_type VARCHAR(10) DEFAULT 'sale';",
            reverse_sql="ALTER TABLE api_house DROP COLUMN listing_type;",
        ),
        migrations.RunSQL(
            sql="UPDATE api_house SET listing_type = 'sale' WHERE listing_type IS NULL;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]

