# Happy Homes System - Complete Overview

## 🏠 System Purpose
**Happy Homes** is a comprehensive property management and community engagement platform for a residential subdivision. It serves as a digital hub connecting residents, administrators, and visitors to manage various aspects of community life.

## 🏗️ Architecture

### Technology Stack
- **Backend**: Django 4.2.23 + Django REST Framework
- **Frontend**: React 19.1.0 + TypeScript + Vite
- **Database**: SQLite3 (development)
- **Authentication**: JWT (JSON Web Tokens) via `djangorestframework-simplejwt`
- **History Tracking**: `django-simple-history` for audit trails
- **Email**: SMTP (Gmail) for notifications
- **Maps**: React Leaflet, Google Maps API integration

### Project Structure
```
happy_homes/
├── backend/          # Django REST API
│   ├── api/         # Main application
│   │   ├── models.py      # Database models
│   │   ├── views.py       # API endpoints & business logic
│   │   ├── serializers.py # Data serialization
│   │   └── urls.py        # URL routing
│   ├── core/        # Django project settings
│   └── media/        # Uploaded files (images, documents)
└── frontend/
    └── my-app/       # React application
        └── src/
            ├── pages/     # React components/pages
            ├── api/       # API client configuration
            └── utils/     # Utilities (auth, config)
```

---

## 👥 User Roles & Permissions

### 1. **Guest/Public Users** (Not Authenticated)
- ✅ View blog posts
- ✅ View blog comments
- ✅ View houses for sale/rent
- ✅ View FAQs
- ✅ Submit contact messages
- ✅ Visitor check-in (using resident PIN)
- ✅ Check visitor status
- ❌ Cannot create content
- ❌ Cannot book facilities
- ❌ Cannot access admin features

### 2. **Regular Users/Residents** (Authenticated, `is_verified=False`)
- ✅ All guest permissions
- ✅ Create account & profile
- ✅ Upload verification documents
- ✅ View own profile
- ✅ View news & alerts
- ✅ View map (read-only)
- ✅ View houses
- ✅ Comment on blog posts
- ❌ Cannot book facilities (requires verification)
- ❌ Cannot access admin features

### 3. **Verified Residents** (Authenticated, `is_verified=True`)
- ✅ All regular user permissions
- ✅ Book facilities (Basketball Court, Swimming Pool)
- ✅ Upload service fee receipts
- ✅ View own service fees
- ✅ Manage visitor check-ins
- ✅ Generate resident PIN
- ✅ Approve/decline visitors
- ✅ View own billing records
- ✅ Create house listings (for sale/rent)

### 4. **Admin Users** (Authenticated, `is_staff=True`)
- ✅ All verified resident permissions
- ✅ Full CRUD on all models
- ✅ Verify/reject user documents
- ✅ Manage bookings (approve/reject)
- ✅ Create/manage available slots
- ✅ Create news & alerts
- ✅ Manage FAQs
- ✅ Manage service fees (upload bills, mark as paid)
- ✅ View all users & manage them
- ✅ View activity logs/history
- ✅ View dashboard statistics
- ✅ Manage pins on map
- ✅ Manage visitor tracking
- ✅ View all houses & manage listings

---

## 📊 Core Features & Modules

### 1. **User Management & Authentication**
- **Registration**: Username, email, password, first/last name, contact number
- **Login**: JWT token-based authentication
- **Profile Management**: Profile image, contact number, document upload
- **Email Verification**: Optional email verification codes
- **Password Reset**: Email-based password reset flow
- **Document Verification**: Users upload documents → Admin verifies → User becomes verified

**Key Models:**
- `User` (Django built-in)
- `UserProfile` (OneToOne with User)
  - `profile_image`
  - `contact_number`
  - `is_verified` (admin-controlled)
  - `document` (verification document)
  - `billing` (legacy field)

**Key Endpoints:**
- `POST /api/register/` - Register new user
- `POST /api/token/` - Login (get JWT)
- `GET /api/profile/` - Get current user profile
- `PUT /api/profile/update/` - Update profile
- `POST /api/profile/upload-document/` - Upload verification document
- `GET /api/admin/pending-verifications/` - Get pending verifications (admin)
- `PUT /api/admin/verify-user/<id>/` - Verify user (admin)
- `PUT /api/admin/reject-user/<id>/` - Reject user (admin)

---

### 2. **Blog/Posts System**
- Create blog posts with title, body, and optional location (lat/lng)
- Comment system for blog posts
- Public viewing (anyone can view posts and comments)
- Authenticated users can create comments

**Key Models:**
- `Post` - Blog posts
  - `title`, `body`, `lat`, `lng`
- `BlogComment` - Comments on posts
  - `post` (ForeignKey)
  - `user` (ForeignKey)
  - `content`
  - `created_at`, `updated_at`

**Key Endpoints:**
- `GET /api/posts/` - List all posts
- `POST /api/posts/` - Create post (authenticated)
- `GET /api/blog-comments/?post_id=<id>` - Get comments for a post
- `POST /api/blog-comments/` - Create comment (authenticated)
- `PUT/PATCH /api/blog-comments/<id>/` - Update comment (owner/admin)
- `DELETE /api/blog-comments/<id>/` - Delete comment (owner/admin)

---

### 3. **Map & Pin Management**
- Interactive map showing property locations
- Pins represent properties/lots
- Pin details: name, location, occupant, status, price, description, square meter, image
- Status tracking: Available, Occupied, Reserved
- Reviews & ratings for pins (1-5 stars)
- Average rating calculation
- Occupancy statistics

**Key Models:**
- `Pin` - Map markers/properties
  - `name`, `latitude`, `longitude`
  - `occupant`, `status`, `price`, `description`
  - `square_meter`, `image`
  - Methods: `get_average_rating()`, `get_review_count()`
- `Review` - Reviews for pins
  - `pin` (ForeignKey)
  - `user` (ForeignKey)
  - `rating` (1-5 stars)
  - `comment`
  - Unique constraint: one review per user per pin

**Key Endpoints:**
- `GET /api/pins/` - List all pins
- `POST /api/pins/` - Create pin
- `GET /api/pins/<id>/` - Get pin details
- `PUT/PATCH /api/pins/<id>/` - Update pin
- `DELETE /api/pins/<id>/` - Delete pin
- `GET /api/reviews/?pin_id=<id>` - Get reviews for a pin
- `POST /api/reviews/` - Create review (authenticated)
- `GET /api/admin/pin-stats/` - Get occupancy statistics (admin)

---

### 4. **Facility Booking System**
- Facilities: Basketball Court, Swimming Pool
- Admin creates available time slots
- Verified residents can book facilities
- Booking status: Pending → Approved/Rejected
- Email notifications on status changes
- Calendar view for bookings
- Booking reports

**Key Models:**
- `Facility` - Available facilities
  - `name` (choices: "Court", "Pool")
- `AvailableSlot` - Admin-created available booking times
  - `facility` (ForeignKey)
  - `date`, `start_time`, `end_time`
- `Booking` - User bookings
  - `user` (ForeignKey)
  - `facility` (ForeignKey)
  - `date`, `start_time`, `end_time`
  - `status` (pending, approved, rejected)
  - `created_at`

**Key Endpoints:**
- `GET /api/facilities/` - List facilities
- `GET /api/available-slots/?facility_id=<id>` - Get available slots
- `POST /api/available-slots/` - Create slot (admin only)
- `GET /api/bookings/?facility_id=<id>` - Get bookings
- `POST /api/bookings/` - Create booking (verified users only)
- `PATCH /api/bookings/<id>/` - Update booking status (admin)

**Business Rules:**
- Only verified users can book
- Admin must create available slots first
- Email sent when booking status changes

---

### 5. **Visitor Management System**
- Residents generate unique 6-digit PINs
- Visitors check in using resident PIN
- Visitor information: name, Gmail, contact number, reason
- Status workflow: Pending → Approved/Declined
- Time tracking: time_in, time_out
- Email notifications to residents and visitors
- Guest check-in (no login required)
- Visitor status checking (public)

**Key Models:**
- `ResidentPin` - Resident PINs
  - `user` (OneToOne)
  - `pin` (6-digit, auto-generated)
  - Method: `generate_pin()`
- `Visitor` - Visitor records
  - `name`, `gmail`, `contact_number`
  - `pin_entered` (the PIN used)
  - `resident` (ForeignKey to ResidentPin)
  - `reason`
  - `status` (pending, approved, declined)
  - `time_in`, `time_out`

**Key Endpoints:**
- `GET /api/resident-pin/my/` - Get own resident PIN
- `POST /api/resident-pin/my/` - Generate new PIN
- `POST /api/visitor/guest-checkin/` - Guest check-in (public)
- `GET /api/visitor/guest-status/` - Check visitor status (public)
- `GET /api/visitor/` - Get visitors (resident sees own)
- `POST /api/visitor/approval/<id>/` - Approve/decline visitor (resident)
- `POST /api/visitor/checkout/<id>/` - Check out visitor (public)
- `GET /api/visitor/pending/` - Get pending visitors (resident)
- `GET /api/admin/visitors/` - Get all visitors (admin)

**Business Rules:**
- Residents generate PINs (6 digits)
- Visitors use PIN to check in
- Resident approves/declines
- Email notifications sent at each step

---

### 6. **News & Alerts System**
- Admin creates news articles
- Admin creates alerts (info, warning, critical)
- Email notifications sent to all users when created
- Public viewing (anyone can view)
- Published/unpublished status

**Key Models:**
- `News` - News articles
  - `title`, `content`
  - `is_published`
  - `created_at`
- `Alert` - Alerts/announcements
  - `title`, `message`
  - `severity` (info, warning, critical)
  - `is_active`
  - `created_at`

**Key Endpoints:**
- `GET /api/news/` - List news
- `POST /api/news/` - Create news (admin)
- `GET /api/alerts/` - List active alerts
- `POST /api/alerts/` - Create alert (admin)

---

### 7. **Contact System**
- Public contact form
- Contact information management (admin)
- Contact messages stored in database
- Email notifications to admin

**Key Models:**
- `ContactInfo` - Contact information (singleton)
  - `address`, `phone`, `email`
- `ContactMessage` - Contact form submissions
  - `name`, `email`, `subject`, `message`
  - `is_resolved`
  - `created_at`

**Key Endpoints:**
- `GET /api/contact-info/` - Get contact info
- `PUT /api/contact-info/<id>/` - Update contact info (admin)
- `POST /api/contact-messages/` - Submit contact message (public)
- `GET /api/contact-messages/` - List messages (admin)

---

### 8. **House Sale/Rental System**
- Verified users can list houses for sale/rent
- House details: title, price, location, description, image
- Public viewing (anyone can view listings)
- Admin can view all listings

**Key Models:**
- `House` - House listings
  - `user` (ForeignKey - owner)
  - `title`, `price`, `location`
  - `description`, `image`
  - `created_at`

**Key Endpoints:**
- `GET /api/guest/houses/` - List all houses (public)
- `GET /api/guest/houses/<id>/` - Get house details (public)
- `GET /api/houses/` - List houses (authenticated - own or all if admin)
- `POST /api/houses/` - Create listing (verified users)
- `PUT/PATCH /api/houses/<id>/` - Update listing (owner/admin)
- `DELETE /api/houses/<id>/` - Delete listing (owner/admin)

---

### 9. **Billing & Service Fee Management**
- Users can upload billing documents
- Admin manages service fees
- Service fee workflow:
  - Admin uploads bill image
  - Homeowner uploads receipt image
  - Admin marks as paid
  - Status: Unpaid → Paid/Delayed
- Automatic delayed status (past due date)
- Email notifications

**Key Models:**
- `BillingRecord` - Billing document uploads
  - `user` (ForeignKey)
  - `file` (FileField)
  - `uploaded_at`
- `ServiceFee` - Service fee records
  - `homeowner` (ForeignKey - non-staff users)
  - `bill_image` (admin uploads)
  - `receipt_image` (homeowner uploads)
  - `policy_image` (admin uploads)
  - `amount`, `due_date`
  - `status` (unpaid, paid, delayed)
  - `month`, `year`
  - `notes`

**Key Endpoints:**
- `POST /api/profile/upload-billing/` - Upload billing document
- `GET /api/admin/user-bills/` - Get all users with bills (admin)
- `DELETE /api/profile/delete-billing/` - Delete billing record
- `GET /api/service-fees/` - Get service fees (own if homeowner, all if admin)
- `POST /api/service-fees/` - Create service fee (admin)
- `PATCH /api/service-fees/<id>/` - Update service fee
  - Homeowners can only update `receipt_image`
  - Admin can update all fields
- `GET /api/billing/` - Get own billing records

**Business Rules:**
- Only verified homeowners can upload receipts
- Admin creates service fees
- Automatic delayed status for past due dates
- Email notifications on bill creation and payment confirmation

---

### 10. **FAQ System**
- Admin creates FAQs
- Public viewing
- Ordering system for display
- Active/inactive status

**Key Models:**
- `FAQ` - Frequently asked questions
  - `question`, `answer`
  - `order` (display order)
  - `is_active`
  - `created_at`, `updated_at`

**Key Endpoints:**
- `GET /api/faq/` - List active FAQs (public)
- `GET /api/faq/` - List all FAQs (admin)
- `POST /api/faq/` - Create FAQ (admin)
- `PUT/PATCH /api/faq/<id>/` - Update FAQ (admin)
- `DELETE /api/faq/<id>/` - Delete FAQ (admin)

---

### 11. **Activity Log / History Tracking**
- Tracks all changes to models with `HistoricalRecords`
- Admin can view complete history
- Shows: model name, history type, user, timestamp

**Key Endpoints:**
- `GET /api/user-history/` - Get all history records (admin)

**Models with History:**
- UserProfile, Post, Message, Subdivision, Pin, Facility, Booking
- News, Alert, ContactInfo, ContactMessage, ResidentPin, Visitor
- FAQ, ServiceFee, Review, BlogComment

---

### 12. **Admin Dashboard**
- Statistics overview:
  - Total users
  - Active bookings
  - Pending approvals
  - Pin statistics (total, occupied, available)
  - Visitors count
  - House listings count
  - Pending verifications
  - Service fees count
- Charts and visualizations
- Quick access to all admin features

**Key Endpoints:**
- `GET /api/admin/dashboard-stats/` - Get dashboard statistics
- `GET /api/admin/pin-stats/` - Get pin statistics

---

## 🔐 Authentication & Security

### JWT Authentication
- Access token lifetime: 30 minutes
- Refresh token lifetime: 1 day
- Token stored in localStorage (frontend)
- Automatic token injection via axios interceptor

### Permission System
- **AllowAny**: Public access
- **IsAuthenticated**: Requires login
- **IsAdminUser**: Requires staff status
- **IsAuthenticatedOrReadOnly**: Read for all, write for authenticated
- **Custom Permissions**: Owner-based (e.g., IsAdminOrOwner)

### CORS Configuration
- Allowed origins configured in `settings.py`
- Supports localhost, ngrok, and local network IPs

---

## 📧 Email System

### Email Configuration
- SMTP: Gmail
- From: `happyphhomes@gmail.com`
- App Password authentication

### Email Notifications Sent For:
1. **User Verification**: Approval/rejection emails
2. **Booking Status**: Changes in booking status
3. **News/Alerts**: New news/alert creation
4. **Visitor Management**: Check-in requests, approvals, checkouts
5. **Service Fees**: Bill creation, payment confirmation, receipt upload
6. **Contact Messages**: New contact form submissions
7. **Password Reset**: Reset link emails

---

## 🗺️ Frontend Routes

### Public Routes
- `/login` - Login page
- `/register` - Registration page
- `/reset-password` - Password reset
- `/home` - Homepage
- `/faq` - FAQ page
- `/contact` - Contact page
- `/house-sales` - House listings (public)
- `/visitor-status` - Check visitor status

### Authenticated Routes
- `/profile` - User profile
- `/map` - Map view (read-only for users)
- `/calendar` - Booking calendar
- `/billing` - Billing & service fees
- `/resident-dashboard` - Resident dashboard
- `/visitor-dashboard` - Visitor dashboard

### Admin Routes
- `/admin-dashboard` - Admin dashboard
- `/admin-dashboard/map` - Map management
- `/admin-dashboard/users` - User management
- `/admin-verification` - Document verification
- `/admin-booking` - Booking management
- `/admin-sales` - House listing management
- `/admin-bills` - Billing management
- `/admin-service-fee` - Service fee management
- `/admin-faq` - FAQ management
- `/visitors-tracking` - Visitor tracking
- `/activity-log` - Activity logs
- `/booking-reports` - Booking reports

---

## 🗄️ Database Models Summary

### Core Models
1. **User** (Django built-in)
2. **UserProfile** - Extended user information
3. **Post** - Blog posts
4. **BlogComment** - Comments on posts
5. **Message** - Legacy messaging (temporary)

### Property Management
6. **Subdivision** - Lot information
7. **Pin** - Map markers/properties
8. **Review** - Reviews for pins
9. **House** - House listings

### Facility & Booking
10. **Facility** - Available facilities
11. **AvailableSlot** - Admin-created booking slots
12. **Booking** - User bookings

### Visitor Management
13. **ResidentPin** - Resident PINs
14. **Visitor** - Visitor records

### Communication
15. **News** - News articles
16. **Alert** - Alerts/announcements
17. **ContactInfo** - Contact information
18. **ContactMessage** - Contact form submissions

### Financial
19. **BillingRecord** - Billing documents
20. **ServiceFee** - Service fee records

### Support
21. **FAQ** - Frequently asked questions

---

## 🔄 Key Workflows

### 1. User Registration & Verification
1. User registers → Account created
2. User uploads verification document
3. Admin reviews document
4. Admin approves/rejects
5. User becomes verified (if approved)
6. Verified users can book facilities

### 2. Facility Booking
1. Admin creates available slots
2. Verified user views available slots
3. User creates booking (pending)
4. Admin approves/rejects
5. Email notification sent
6. User can view booking status

### 3. Visitor Check-in
1. Resident generates PIN
2. Visitor enters PIN + details (public)
3. Visitor status: Pending
4. Email to resident
5. Resident approves/declines
6. Email to visitor
7. Visitor checks in (time_in recorded)
8. Visitor checks out (time_out recorded)

### 4. Service Fee Payment
1. Admin creates service fee (uploads bill)
2. Email to homeowner
3. Homeowner uploads receipt
4. Email to admin
5. Admin marks as paid
6. Email confirmation to homeowner

---

## 🛠️ Development Setup

### Backend
```bash
cd backend
python -m venv env
.\env\Scripts\activate  # Windows
pip install django djangorestframework django-cors-headers djangorestframework-simplejwt django-simple-history
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend/my-app
npm install
npm start  # or npm run dev
```

### Quick Start Scripts
- `FIX-AND-RUN.bat` - Fixes virtual environment and starts backend
- `START-BACKEND.bat` - Starts backend server
- `start-server.bat` - Starts backend server

---

## 📝 Important Notes

1. **Database**: Currently using SQLite3 (development). For production, switch to PostgreSQL/MySQL.

2. **Media Files**: Stored in `backend/media/` with organized subdirectories:
   - `profile_images/`
   - `pin_images/`
   - `house_images/`
   - `documents/`
   - `billing/`
   - `service_fees/`

3. **History Tracking**: All major models use `simple_history` for audit trails.

4. **Email**: Uses Gmail SMTP with app password. Configure in `settings.py`.

5. **CORS**: Configured for development. Update `CORS_ALLOWED_ORIGINS` for production.

6. **JWT Tokens**: Stored in localStorage. Consider httpOnly cookies for production.

7. **File Uploads**: Handled via Django's FileField/ImageField. Files stored in `MEDIA_ROOT`.

---

## 🎯 System Goals

1. **Community Management**: Centralized platform for subdivision management
2. **Resident Services**: Facility booking, visitor management, billing
3. **Communication**: News, alerts, contact system
4. **Property Management**: Map visualization, house listings, occupancy tracking
5. **Administrative Control**: User verification, booking approval, service fee management
6. **Transparency**: Activity logs, history tracking, public FAQs

---

## 🔮 Future Enhancements (Potential)

- Payment gateway integration
- Mobile app (React Native)
- Real-time notifications (WebSockets)
- Advanced analytics dashboard
- Document management system
- Maintenance request system
- Event management
- Community forum/discussion board
- QR code generation for visitor check-in
- SMS notifications
- Multi-language support

---

This system provides a comprehensive solution for managing a residential community, from user verification to facility bookings, visitor management, and financial tracking. All features are designed with security, user experience, and administrative control in mind.

