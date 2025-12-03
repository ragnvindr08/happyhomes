# Generated migration for Post image field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0058_merge_0049_add_listing_type_column_and_0057'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='blog_images/'),
        ),
        migrations.AddField(
            model_name='historicalpost',
            name='image',
            field=models.TextField(blank=True, max_length=100, null=True),
        ),
    ]

