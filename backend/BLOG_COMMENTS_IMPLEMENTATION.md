# Blog Comments Backend Implementation Guide

## Overview
This document explains how the Blog Comments backend was implemented, including the model, serializer, views, and permissions.

## What Was Created

### 1. **BlogComment Model** (`backend/api/models.py`)
```python
class BlogComment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    history = HistoricalRecords()
```

**Features:**
- Links to a `Post` (blog post)
- Links to a `User` (commenter)
- Stores comment content
- Tracks creation and update timestamps
- Includes history tracking for audit purposes

### 2. **BlogCommentSerializer** (`backend/api/serializers.py`)
```python
class BlogCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    is_admin = serializers.SerializerMethodField()
    post_title = serializers.CharField(source='post.title', read_only=True)
```

**Features:**
- Automatically includes username, user_id, and admin status
- Includes post title for easy reference
- Read-only fields for user and timestamps

### 3. **BlogCommentViewSet** (`backend/api/views.py`)
This is the main API endpoint with smart permissions:

#### **Permissions:**
- **GET (List/Retrieve)**: ✅ **Anyone can view** (guests, users, admins)
- **POST (Create)**: ✅ **Only authenticated users** (users and admins can comment)
- **PUT/PATCH (Update)**: ✅ **Only comment owner or admin**
- **DELETE**: ✅ **Only comment owner or admin**

#### **Key Methods:**
1. `get_queryset()` - Filters comments by `post_id` query parameter
2. `perform_create()` - Automatically sets the user to the current authenticated user
3. `get_permissions()` - Dynamic permissions based on action
4. `update()` - Checks ownership before allowing updates
5. `destroy()` - Checks ownership before allowing deletion

### 4. **URL Route** (`backend/api/urls.py`)
```python
router.register(r'blog-comments', BlogCommentViewSet, basename='blog-comment')
```

**Endpoint:** `/api/blog-comments/`

### 5. **Admin Interface** (`backend/api/admin.py`)
Added `BlogCommentAdmin` for easy management in Django admin panel.

## API Endpoints

### Base URL: `http://127.0.0.1:8000/api/blog-comments/`

### 1. **List All Comments** (Anyone can view)
```http
GET /api/blog-comments/
```
**Query Parameters:**
- `post_id` (optional): Filter comments by blog post ID
  - Example: `/api/blog-comments/?post_id=1`

**Response:**
```json
[
  {
    "id": 1,
    "post": 1,
    "post_title": "My Blog Post",
    "user": 2,
    "user_id": 2,
    "username": "john_doe",
    "is_admin": false,
    "content": "Great article!",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

### 2. **Get Single Comment** (Anyone can view)
```http
GET /api/blog-comments/1/
```

### 3. **Create Comment** (Authenticated users only)
```http
POST /api/blog-comments/
Authorization: Bearer <token>
Content-Type: application/json

{
  "post": 1,
  "content": "This is my comment!"
}
```

**Response:**
```json
{
  "id": 2,
  "post": 1,
  "post_title": "My Blog Post",
  "user": 3,
  "user_id": 3,
  "username": "jane_smith",
  "is_admin": true,
  "content": "This is my comment!",
  "created_at": "2024-01-15T11:00:00Z",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

### 4. **Update Comment** (Owner or Admin only)
```http
PATCH /api/blog-comments/2/
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated comment text"
}
```

### 5. **Delete Comment** (Owner or Admin only)
```http
DELETE /api/blog-comments/2/
Authorization: Bearer <token>
```

## Permission Flow

### Scenario 1: Guest User (Not Logged In)
- ✅ Can **view** all comments
- ❌ Cannot **create** comments
- ❌ Cannot **update** comments
- ❌ Cannot **delete** comments

### Scenario 2: Regular User (Logged In)
- ✅ Can **view** all comments
- ✅ Can **create** comments
- ✅ Can **update** their own comments
- ✅ Can **delete** their own comments
- ❌ Cannot update/delete other users' comments

### Scenario 3: Admin User (Logged In + is_staff=True)
- ✅ Can **view** all comments
- ✅ Can **create** comments
- ✅ Can **update** any comment (including others')
- ✅ Can **delete** any comment (including others')

## Frontend Integration Example

### Fetch Comments for a Blog Post
```javascript
// Get comments for post ID 1
fetch('http://127.0.0.1:8000/api/blog-comments/?post_id=1')
  .then(res => res.json())
  .then(comments => {
    console.log('Comments:', comments);
  });
```

### Create a Comment (Authenticated User)
```javascript
const token = localStorage.getItem('token'); // Your JWT token

fetch('http://127.0.0.1:8000/api/blog-comments/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    post: 1, // Blog post ID
    content: 'This is my comment!'
  })
})
  .then(res => res.json())
  .then(comment => {
    console.log('Comment created:', comment);
  });
```

### Update a Comment (Owner or Admin)
```javascript
fetch('http://127.0.0.1:8000/api/blog-comments/2/', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: 'Updated comment text'
  })
})
  .then(res => res.json())
  .then(comment => {
    console.log('Comment updated:', comment);
  });
```

### Delete a Comment (Owner or Admin)
```javascript
fetch('http://127.0.0.1:8000/api/blog-comments/2/', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
  }
})
  .then(() => {
    console.log('Comment deleted');
  });
```

## Database Migration

After creating the model, run:
```bash
cd backend
.\env\Scripts\activate
python manage.py makemigrations
python manage.py migrate
```

This creates the `blog_comment` table in your database.

## Testing the API

### Using cURL:

1. **List comments (no auth needed):**
```bash
curl http://127.0.0.1:8000/api/blog-comments/
```

2. **Create comment (auth required):**
```bash
curl -X POST http://127.0.0.1:8000/api/blog-comments/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"post": 1, "content": "Test comment"}'
```

3. **Filter by post_id:**
```bash
curl http://127.0.0.1:8000/api/blog-comments/?post_id=1
```

## Summary

✅ **What works:**
- Guests can view all comments (read-only)
- Authenticated users can create comments
- Users can only edit/delete their own comments
- Admins can edit/delete any comment
- Comments are automatically linked to the user who created them
- Comments can be filtered by blog post ID

✅ **Security:**
- JWT authentication required for creating/updating/deleting
- Ownership checks prevent unauthorized modifications
- Admin override for moderation purposes

✅ **Features:**
- History tracking (via simple_history)
- Timestamps (created_at, updated_at)
- Admin interface for management
- RESTful API design

## Next Steps

1. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

2. **Test the endpoints** using Postman, cURL, or your frontend

3. **Update your frontend** to use the new API endpoints instead of localStorage

4. **Optional:** Add features like:
   - Comment replies (nested comments)
   - Comment likes/reactions
   - Comment moderation flags
   - Email notifications for new comments

