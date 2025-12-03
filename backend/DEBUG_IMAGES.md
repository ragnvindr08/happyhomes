# Debugging House Images Issue

## Quick Test Steps

1. **Check if images are in database:**
   ```bash
   cd backend
   python manage.py shell
   ```
   Then run:
   ```python
   from api.models import House, HouseImage
   house = House.objects.order_by('-created_at').first()
   print(f"House ID: {house.id}, Title: {house.title}")
   print(f"Images count: {HouseImage.objects.filter(house=house).count()}")
   for img in HouseImage.objects.filter(house=house):
       print(f"  - {img.image.name}")
   ```

2. **Test API directly:**
   - Open browser: `http://127.0.0.1:8000/api/houses/` (if logged in)
   - Or: `http://127.0.0.1:8000/api/guest/houses/` (public)
   - Check if `image_urls` array has data

3. **Check backend console when creating house:**
   - Look for `[CREATE]` messages
   - Look for `[IMAGES]` messages
   - Check if images are being saved

4. **Check browser console:**
   - Open DevTools (F12)
   - Go to Network tab
   - Create a house with images
   - Check the POST request response
   - Look for `image_urls` in the JSON response

## Common Issues

1. **Images not being uploaded:**
   - Check browser Network tab - is FormData being sent?
   - Check backend console - are files being received?

2. **Images saved but not in response:**
   - Check serializer logs
   - Verify images are in database (step 1 above)

3. **Images in response but not displaying:**
   - Check image URLs are absolute (start with http://)
   - Check browser console for image load errors
   - Verify media files are accessible

