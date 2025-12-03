"""
Simple script to create a test post in the database.
Run this from the backend directory: python create_test_post.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Post

# Create a test post if it doesn't exist
post, created = Post.objects.get_or_create(
    title="Building a Stronger Community: Our Journey Together",
    defaults={
        'body': "At Happy Homes, we believe that a house becomes a home when neighbors become friends. Over the past year, we've witnessed incredible community spirit through our various events, from summer barbecues to holiday celebrations. This blog post shares heartwarming stories of how our residents have come together to create lasting friendships and support each other through life's ups and downs. Join us as we celebrate the bonds that make Happy Homes more than just a place to live—it's a place to thrive."
    }
)

if created:
    print(f"[SUCCESS] Created test post with ID: {post.id}")
    print(f"   Title: {post.title}")
else:
    print(f"[INFO] Post already exists with ID: {post.id}")
    print(f"   Title: {post.title}")

# List all posts
all_posts = Post.objects.all()
print(f"\n[INFO] Total posts in database: {all_posts.count()}")
for p in all_posts:
    print(f"   - ID: {p.id}, Title: {p.title}")

