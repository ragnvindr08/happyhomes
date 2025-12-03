# admin.py
from django.contrib import admin
from django.utils import timezone
from .models import Post, Message, Subdivision, Pin, Facility, Booking, News, Alert, ContactInfo, ContactMessage, ResidentPin, Visitor, House, BlogComment
from .models import UserProfile, ServiceFee, Bulletin, Maintenance, MaintenanceRequest, CommunityMedia, VisitorRequest
from django.utils.html import format_html


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'lat', 'lng')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'text', 'timestamp')

@admin.register(Subdivision)
class SubdivisionAdmin(admin.ModelAdmin):
    list_display = ('lot_number', 'is_occupied', 'owner_name')
    list_filter = ('is_occupied',)
    search_fields = ('lot_number', 'owner_name')

@admin.register(Pin)
class PinAdmin(admin.ModelAdmin):
    list_display = ('name', 'latitude', 'longitude')

@admin.register(Facility)
class FacilityAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'facility_display', 'date', 'start_time', 'end_time', 'status', 'created_at')
    list_filter = ('status', 'date', 'created_at', 'facility')
    search_fields = ('user__username', 'user__email', 'facility__name', 'date')
    list_select_related = ('user', 'facility')
    # Removed date_hierarchy to avoid Python 3.14 compatibility issue
    readonly_fields = ('created_at',)
    ordering = ('-date', '-start_time')
    
    def get_queryset(self, request):
        """Optimize queryset with select_related to prevent N+1 queries"""
        qs = super().get_queryset(request)
        return qs.select_related('user', 'facility')
    
    def facility_display(self, obj):
        """Safely display facility name"""
        if obj.facility:
            return obj.facility.get_name_display()
        return "-"
    facility_display.short_description = 'Facility'
    facility_display.admin_order_field = 'facility__name' 

@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_published', 'created_at')
    list_filter = ('is_published',)
    search_fields = ('title',)


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('title', 'severity', 'is_active', 'created_at')
    list_filter = ('severity', 'is_active')
    search_fields = ('title',)


@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    list_display = ('address', 'phone', 'email')


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('subject', 'name', 'email', 'is_resolved', 'created_at')
    list_filter = ('is_resolved',)
    search_fields = ('subject', 'name', 'email')

# --- ResidentPin & Visitor Admin ---
class VisitorInline(admin.TabularInline):
    model = Visitor
    extra = 0
    readonly_fields = ('time_in', 'time_out')
    fields = ('name', 'pin_entered', 'status', 'time_in', 'time_out')

@admin.register(ResidentPin)
class ResidentPinAdmin(admin.ModelAdmin):
    list_display = ('user', 'pin')
    inlines = [VisitorInline]

@admin.register(Visitor)
class VisitorAdmin(admin.ModelAdmin):
    list_display = ('name', 'gmail', 'pin_entered', 'resident', 'status', 'time_in', 'time_out')
    list_filter = ('status',)
    search_fields = ('name', 'gmail', 'pin_entered', 'resident__user__username')
    actions = ['approve_visitor', 'decline_visitor']

    def approve_visitor(self, request, queryset):
        queryset.update(status='approved', time_in=timezone.now())
        self.message_user(request, "[SUCCESS] Selected visitors have been approved.")
    approve_visitor.short_description = "Approve selected visitors"

    def decline_visitor(self, request, queryset):
        queryset.update(status='declined', time_out=timezone.now())
        self.message_user(request, "[INFO] Selected visitors have been declined.")
    decline_visitor.short_description = "Decline selected visitors"

@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    # Base configuration - listing_type will be added dynamically if it exists
    list_display = ('title', 'user', 'price', 'location', 'created_at')
    list_filter = ('created_at', 'user')
    search_fields = ('title', 'location', 'description', 'user__username')
    readonly_fields = ('created_at',)
    
    # Show image preview
    def image_tag(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" width="100" />'
        return "-"
    image_tag.allow_tags = True
    image_tag.short_description = 'Image'
    
    # Base fields - listing_type added dynamically
    fields = ('user', 'title', 'price', 'location', 'description', 'image', 'image_tag', 'created_at')
    
    def _column_exists(self, column_name):
        """Check if a column exists in the database"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("PRAGMA table_info(api_house)")
                columns = [row[1] for row in cursor.fetchall()]
                return column_name in columns
        except:
            return False
    
    def get_list_display(self, request):
        """Dynamically add listing_type if column exists"""
        base_list = list(self.list_display)
        if self._column_exists('listing_type') and 'listing_type' not in base_list:
            # Insert before 'created_at'
            try:
                idx = base_list.index('created_at')
                base_list.insert(idx, 'listing_type')
            except ValueError:
                base_list.append('listing_type')
        return base_list
    
    def get_list_filter(self, request):
        """Dynamically add listing_type filter if column exists"""
        base_filters = list(self.list_filter)
        if self._column_exists('listing_type') and 'listing_type' not in base_filters:
            base_filters.append('listing_type')
        return base_filters
    
    def get_fields(self, request, obj=None):
        """Dynamically add listing_type field if column exists"""
        base_fields = list(self.fields)
        if self._column_exists('listing_type') and 'listing_type' not in base_fields:
            # Insert before 'image'
            try:
                idx = base_fields.index('image')
                base_fields.insert(idx, 'listing_type')
            except ValueError:
                base_fields.append('listing_type')
        return base_fields

@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ('post', 'user', 'content_preview', 'created_at', 'updated_at')
    list_filter = ('created_at', 'post', 'user')
    search_fields = ('content', 'user__username', 'post__title')
    readonly_fields = ('created_at', 'updated_at')
    
    def content_preview(self, obj):
        """Show first 50 characters of comment"""
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'    

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "contact_number",
        "is_verified",
        "document_link",
        "billing_link",
        "profile_image_preview",
    )

    search_fields = ("user__username", "contact_number")
    list_filter = ("is_verified",)

    # Show document download link
    def document_link(self, obj):
        if obj.document:
            return format_html(
                "<a href='{}' target='_blank'>Download</a>",
                obj.document.url
            )
        return "No document"

    document_link.short_description = "Document"

    # Show billing download link
    def billing_link(self, obj):
        if obj.billing:
            return format_html(
                "<a href='{}' target='_blank'>Billing</a>",
                obj.billing.url
            )
        return "No billing"

    billing_link.short_description = "Billing"

    # Show profile image thumbnail
    def profile_image_preview(self, obj):
        if obj.profile_image:
            return format_html(
                "<img src='{}' width='50' height='50' style='border-radius: 5px;'/>",
                obj.profile_image.url
            )
        return "No Image"

    profile_image_preview.short_description = "Profile Image"

@admin.register(ServiceFee)
class ServiceFeeAdmin(admin.ModelAdmin):
    list_display = ("homeowner", "month", "year", "amount", "due_date", "status", "created_at")
    list_filter = ("status", "created_at", "due_date")
    search_fields = ("homeowner__username", "homeowner__email", "month", "year", "notes")
    readonly_fields = ("created_at", "updated_at")
    fields = (
        "homeowner",
        "bill_image",
        "bill_image_preview",
        "receipt_image",
        "receipt_image_preview",
        "policy_image",
        "policy_image_preview",
        "amount",
        "due_date",
        "status",
        "month",
        "year",
        "notes",
        "created_at",
        "updated_at",
    )
    
    def bill_image_preview(self, obj):
        if obj.bill_image:
            return format_html(
                "<img src='{}' width='200' height='200' style='object-fit: contain;'/>",
                obj.bill_image.url
            )
        return "No bill image"
    bill_image_preview.short_description = "Bill Image Preview"
    
    def receipt_image_preview(self, obj):
        if obj.receipt_image:
            return format_html(
                "<img src='{}' width='200' height='200' style='object-fit: contain;'/>",
                obj.receipt_image.url
            )
        return "No receipt image"
    receipt_image_preview.short_description = "Receipt Image Preview"
    
    def policy_image_preview(self, obj):
        if obj.policy_image:
            return format_html(
                "<img src='{}' width='200' height='200' style='object-fit: contain;'/>",
                obj.policy_image.url
            )
        return "No policy image"
    policy_image_preview.short_description = "Policy Image Preview"

@admin.register(Bulletin)
class BulletinAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_published', 'created_by', 'created_at', 'updated_at')
    list_filter = ('is_published', 'created_at')
    search_fields = ('title', 'content', 'created_by__username')
    readonly_fields = ('created_at', 'updated_at')
    fields = ('title', 'content', 'is_published', 'created_by', 'created_at', 'updated_at')    

@admin.register(Maintenance)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = ('facility', 'start_date', 'end_date', 'start_time', 'end_time', 'reason', 'created_at', 'updated_at')
    list_filter = ('facility', 'start_date', 'end_date', 'start_time', 'end_time')
    search_fields = ('facility__name', 'reason', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    fields = ('facility', 'start_date', 'end_date', 'start_time', 'end_time', 'reason', 'created_at', 'updated_at')

@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'homeowner', 'maintenance_type', 'preferred_date', 'preferred_time', 'is_urgent', 'status', 'approved_by', 'created_at')
    list_filter = ('status', 'maintenance_type', 'is_urgent', 'use_external_contractor', 'created_at', 'approved_by')
    search_fields = ('homeowner__username', 'homeowner__email', 'maintenance_type', 'description', 'external_contractor_name')
    readonly_fields = ('created_at', 'updated_at', 'approved_at')
    fieldsets = (
        ('Request Information', {
            'fields': ('homeowner', 'maintenance_type', 'description', 'preferred_date', 'preferred_time', 'is_urgent')
        }),
        ('External Contractor', {
            'fields': ('use_external_contractor', 'external_contractor_name', 'external_contractor_contact', 'external_contractor_company'),
            'classes': ('collapse',)
        }),
        ('Status & Approval', {
            'fields': ('status', 'approved_by', 'approved_at', 'declined_reason')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(CommunityMedia)
class CommunityMediaAdmin(admin.ModelAdmin):
    list_display = ('title', 'media_type', 'category', 'uploaded_by', 'is_approved', 'is_featured', 'is_public', 'views_count', 'created_at')
    list_filter = ('media_type', 'category', 'is_approved', 'is_featured', 'is_public', 'created_at')
    search_fields = ('title', 'description', 'uploaded_by__username')
    readonly_fields = ('views_count', 'likes_count', 'created_at', 'updated_at', 'media_preview')
    fields = (
        'title', 'description', 'media_file', 'media_preview', 'media_type', 'category',
        'uploaded_by', 'approved_by', 'is_approved', 'is_featured', 'is_public',
        'order', 'views_count', 'likes_count', 'created_at', 'updated_at'
    )
    
    def media_preview(self, obj):
        """Show media preview in admin"""
        if obj.media_file:
            if obj.media_type == 'image':
                return format_html(
                    "<img src='{}' width='200' height='200' style='object-fit: contain; border-radius: 8px;'/>",
                    obj.media_file.url
                )
            else:
                return format_html(
                    "<video width='200' height='200' controls style='border-radius: 8px;'><source src='{}' type='video/mp4'></video>",
                    obj.media_file.url
                )
        return "No media"
    media_preview.short_description = "Media Preview"


@admin.register(VisitorRequest)
class VisitorRequestAdmin(admin.ModelAdmin):
    list_display = ('visitor_name', 'resident', 'visit_date', 'visit_start_time', 'visit_end_time', 'one_time_pin', 'status', 'approved_by', 'created_at')
    list_filter = ('status', 'visit_date', 'created_at', 'approved_by')
    search_fields = ('visitor_name', 'visitor_email', 'resident__username', 'one_time_pin')
    readonly_fields = ('one_time_pin', 'approved_at', 'created_at', 'updated_at', 'email_sent_at', 'pdf_generated', 'email_sent')
    fieldsets = (
        ('Visitor Information', {
            'fields': ('visitor_name', 'visitor_email', 'visitor_contact_number', 'reason')
        }),
        ('Access Information', {
            'fields': ('one_time_pin', 'visit_date', 'visit_start_time', 'visit_end_time')
        }),
        ('Status & Approval', {
            'fields': ('status', 'resident', 'approved_by', 'approved_at', 'declined_reason')
        }),
        ('PDF & Email', {
            'fields': ('pdf_generated', 'pdf_file_path', 'email_sent', 'email_sent_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """Make additional fields readonly based on status"""
        readonly = list(self.readonly_fields)
        if obj and obj.status != 'pending_admin':
            readonly.extend(['status', 'approved_by', 'approved_at'])
        return readonly