# Generated migration to add image field to HistoricalPost

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0060_alter_house_image_alter_houseimage_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='historicalpost',
            name='image',
            field=models.TextField(blank=True, max_length=100, null=True),
        ),
    ]

