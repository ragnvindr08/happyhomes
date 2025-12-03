# Homeowner/Resident Features Review

## Feature Checklist

### ✅ **1. Submit and track maintenance or repair requests**
**Status: FULLY IMPLEMENTED**

**Backend:**
- `MaintenanceRequest` model exists with full CRUD operations
- Maintenance types include: carpenter, aircon, plumbing, electrical, roofing, renovation, painting, flooring, appliance repair, other
- Status tracking: pending, approved, declined, in_progress, completed
- Homeowners can create, update (pending only), and delete their own requests
- Admin approval workflow with email notifications

**Frontend:**
- `MaintenanceRequestPage.tsx` - Full UI for submitting and tracking requests
- View all requests, filter by status, edit pending requests
- Form includes: maintenance type, description, preferred date/time, urgency, external contractor option

**Endpoints:**
- `POST /api/maintenance-requests/` - Create request
- `GET /api/maintenance-requests/` - List own requests
- `PATCH /api/maintenance-requests/{id}/` - Update pending request
- `DELETE /api/maintenance-requests/{id}/` - Delete own request
- `POST /api/maintenance-requests/{id}/approve/` - Admin approve
- `POST /api/maintenance-requests/{id}/decline/` - Admin decline

---

### ✅ **2. Reserve community amenities (clubhouse, pool, courts)**
**Status: FULLY IMPLEMENTED**

**Backend:**
- `Facility` model with choices: Basketball Court, Swimming Pool, Clubhouse
- `Booking` model for reservations
- `AvailableSlot` model for admin-created time slots
- Status: pending, approved, rejected
- Only verified users can book

**Frontend:**
- `BookingAmenities.tsx` - Full booking interface
- Calendar view, facility selection, time slot selection
- View own bookings, admin can approve/reject

**Endpoints:**
- `GET /api/facilities/` - List facilities
- `GET /api/available-slots/?facility_id={id}` - Get available slots
- `POST /api/bookings/` - Create booking (verified users)
- `GET /api/bookings/` - List bookings
- `PATCH /api/bookings/{id}/` - Update booking status (admin)

**Note:** Clubhouse is in the model but may need to be added to the frontend if not visible.

---

### ✅ **3. Upload payment receipts for association dues, reservation fees, and other charges**
**Status: FULLY IMPLEMENTED**

**Backend:**
- `ServiceFee` model with `receipt_image` field
- Homeowners can upload receipt images via PATCH
- Admin can view all receipts and update payment status
- Email notifications when receipt is uploaded

**Frontend:**
- `Billing.tsx` - Full billing interface
- View all service fees, upload receipt images
- Status tracking: unpaid, paid, delayed

**Endpoints:**
- `GET /api/service-fees/` - List service fees (own for homeowners, all for admin)
- `PATCH /api/service-fees/{id}/` - Update receipt_image (homeowners) or status (admin)

**Limitation:** 
- Only service fees are supported
- No separate "reservation fees" or "other charges" models
- All payments go through ServiceFee model

---

### ❌ **4. Submit renovation plans for approval—particularly for full-home renovations or structural modifications**
**Status: NOT IMPLEMENTED**

**Current State:**
- "Renovation" exists only as a maintenance request type
- This is for requesting renovation work to be done, NOT for policy approval
- No separate renovation policy submission system

**What's Missing:**
- `RenovationPolicySubmission` model
- Document upload for renovation plans/blueprints
- Admin review/approval workflow for renovation policies
- Feedback mechanism for policy submissions
- Distinction between maintenance request (work needed) vs policy submission (plan approval)

**Required Implementation:**
- New model for renovation policy submissions
- Fields: homeowner, renovation_type, description, plans_documents, contractor_info, timeline, status, admin_feedback
- Admin approval workflow similar to maintenance requests but for policy compliance

---

### ⚠️ **5. Post community advertisements (subject to admin review and approval)**
**Status: PARTIALLY IMPLEMENTED**

**Current State:**
- `CommunityMedia` model exists with approval workflow
- Users can upload media (images/videos) with categories
- Admin approval required for non-admin uploads
- Categories: events, facilities, properties, activities, announcements

**What Exists:**
- Media upload with approval (`is_approved` field)
- Admin can approve/reject media submissions
- Public viewing of approved media

**What's Missing:**
- No dedicated "advertisement" model or category
- CommunityMedia is for gallery/media, not specifically for advertisements
- No distinction between community media and business advertisements (e.g., small stores, rental units, apartments)
- No advertisement-specific fields (business name, contact info, pricing, etc.)

**Gap:**
- The requirement mentions "community advertisements" for services like small stores, rental units, apartments
- This is different from general community media
- Should have a separate `CommunityAdvertisement` model or extend CommunityMedia with advertisement-specific fields

---

### ⚠️ **6. Pre-approve visitors using a QR Code-based Gate Security System (each homeowner receives a permanent personal QR code)**
**Status: PARTIALLY IMPLEMENTED**

**Current State:**
- `ResidentPin` model exists with 6-digit PIN generation
- `VisitorRequest` model with one-time PIN system
- QR code libraries installed (`qrcode.react`, `react-qr-scanner`)
- Visitor request system with PIN generation and PDF generation

**What Exists:**
- Resident PIN system (6-digit numeric PIN)
- Visitor request system with one-time PINs
- PDF generation for visitor requests
- PIN-based visitor check-in

**What's Missing:**
- **No permanent QR code generation for homeowners**
- ResidentPin only generates numeric PINs, not QR codes
- No QR code display/export for homeowners
- No gate security QR code scanning system
- VisitorRequest uses one-time PINs, not permanent homeowner QR codes

**Gap:**
- Requirement specifies: "each homeowner receives a permanent personal QR code"
- Current system uses numeric PINs, not QR codes
- Need to:
  1. Generate QR codes for ResidentPin (encode PIN or user ID)
  2. Display QR code in homeowner dashboard
  3. Allow download/print of QR code
  4. Gate security system to scan QR codes (separate endpoint/app)

---

### ✅ **7. Access community information, updates, announcements, and downloadable documents**
**Status: FULLY IMPLEMENTED**

**Backend:**
- `News` model - Community news articles
- `Alert` model - Urgent announcements with severity levels
- `Bulletin` model - Bulletin board posts
- `Post` model - Blog posts
- `FAQ` model - Frequently asked questions
- `ContactInfo` model - Contact information

**Frontend:**
- `HomePage.tsx` - Displays news, alerts, bulletins
- `NewsAlerts.tsx` - Dedicated news and alerts page
- Public access to most information

**Endpoints:**
- `GET /api/news/` - List news (public)
- `GET /api/alerts/` - List active alerts (public)
- `GET /api/bulletins/` - List bulletins (public)
- `GET /api/posts/` - List blog posts (public)
- `GET /api/faq/` - List FAQs (public)
- `GET /api/contact-info/` - Get contact info (public)

**Downloadable Documents:**
- Service fee policy documents (`policy_image` in ServiceFee model)
- Visitor request PDFs (generated on approval)
- User verification documents (uploaded by users)

**Limitation:**
- No dedicated "documents" section for general downloadable files
- Documents are attached to specific features (service fees, visitor requests)
- May need a `Document` model for general community documents (HOA bylaws, forms, etc.)

---

## Summary

| Feature | Status | Notes |
|---------|--------|-------|
| 1. Submit and track maintenance requests | ✅ Complete | Full implementation |
| 2. Reserve community amenities | ✅ Complete | Clubhouse, Pool, Courts |
| 3. Upload payment receipts | ✅ Complete | Service fees only |
| 4. Submit renovation plans | ❌ Missing | Only maintenance request type exists |
| 5. Post community advertisements | ⚠️ Partial | Media exists, but not advertisement-specific |
| 6. QR Code visitor pre-approval | ⚠️ Partial | PIN system exists, QR codes not generated |
| 7. Access community information | ✅ Complete | News, alerts, bulletins available |

## Recommendations

1. **Renovation Policy Submissions:** Create new `RenovationPolicySubmission` model and workflow
2. **Community Advertisements:** Either create `CommunityAdvertisement` model or add advertisement category/fields to CommunityMedia
3. **QR Code System:** 
   - Generate QR codes for ResidentPin (encode user ID or PIN)
   - Add QR code display in homeowner dashboard
   - Create gate security scanning endpoint
4. **Downloadable Documents:** Consider adding a general `Document` model for community documents (bylaws, forms, policies)

