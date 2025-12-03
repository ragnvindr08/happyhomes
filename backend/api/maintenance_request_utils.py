from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from django.utils.html import strip_tags
from django.contrib.auth.models import User


def send_maintenance_request_created_emails(maintenance_request):
    """
    Send emails when maintenance request is created:
    1. Confirmation to homeowner
    2. Notification to all admins (highlight if urgent)
    """
    try:
        homeowner = maintenance_request.homeowner
        homeowner_email = homeowner.email
        homeowner_name = homeowner.first_name or homeowner.username
        
        # 1. Email to Homeowner - Confirmation
        if homeowner_email:
            homeowner_subject = f"✅ Maintenance Request Submitted - {maintenance_request.get_maintenance_type_display()}"
            
            urgent_badge = ""
            if maintenance_request.is_urgent:
                urgent_badge = """
                <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; color: #856404; font-weight: bold;">⚠️ URGENT REQUEST</p>
                </div>
                """
            
            external_contractor_section = ""
            if maintenance_request.use_external_contractor:
                external_contractor_section = f"""
                <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2196F3;">
                    <p style="margin: 0;"><strong>External Contractor Information:</strong></p>
                    <p style="margin: 5px 0;"><strong>Name:</strong> {maintenance_request.external_contractor_name}</p>
                    <p style="margin: 5px 0;"><strong>Contact:</strong> {maintenance_request.external_contractor_contact}</p>
                    {f'<p style="margin: 5px 0;"><strong>Company:</strong> {maintenance_request.external_contractor_company}</p>' if maintenance_request.external_contractor_company else ''}
                </div>
                """
            
            homeowner_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #2e6F40 0%, #4CAF50 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
                    <h1 style="margin: 0;">✅ Maintenance Request Submitted</h1>
                </div>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p>Hello <strong>{homeowner_name}</strong>,</p>
                    
                    <p>Your maintenance request has been successfully submitted and is now <strong style="color: #f0ad4e;">PENDING</strong> admin approval.</p>
                    
                    {urgent_badge}
                    
                    <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2e6F40;">
                        <h3 style="margin-top: 0; color: #2e6F40;">Request Details:</h3>
                        <p><strong>Maintenance Type:</strong> {maintenance_request.get_maintenance_type_display()}</p>
                        <p><strong>Description:</strong> {maintenance_request.description}</p>
                        <p><strong>Preferred Date:</strong> {maintenance_request.preferred_date.strftime('%B %d, %Y')}</p>
                        <p><strong>Preferred Time:</strong> {maintenance_request.preferred_time.strftime('%I:%M %p')}</p>
                        <p><strong>Status:</strong> <span style="color: #f0ad4e; font-weight: bold;">PENDING APPROVAL</span></p>
                    </div>
                    
                    {external_contractor_section}
                    
                    <p>You will receive an email notification once the admin reviews your request.</p>
                    <p>You can view your request status at: <a href="{settings.FRONTEND_URL}/maintenance-request" style="color: #2e6F40; font-weight: bold;">View My Requests</a></p>
                    
                    <p style="margin-top: 30px;">Thank you,<br><strong>Happy Homes Community Management</strong></p>
                </div>
            </body>
            </html>
            """
            
            homeowner_plain = strip_tags(homeowner_html)
            
            send_mail(
                subject=homeowner_subject,
                message=homeowner_plain,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[homeowner_email],
                html_message=homeowner_html,
                fail_silently=True,
            )
            print(f"[SUCCESS] Confirmation email sent to homeowner: {homeowner_email}")
        
        # 2. Email to All Admins - New Request Notification
        admin_users = User.objects.filter(is_staff=True, is_active=True)
        admin_emails = [admin.email for admin in admin_users if admin.email]
        
        if admin_emails:
            urgent_label = "🚨 URGENT - " if maintenance_request.is_urgent else ""
            admin_subject = f"{urgent_label}New Maintenance Request - {maintenance_request.get_maintenance_type_display()}"
            
            urgent_section = ""
            if maintenance_request.is_urgent:
                urgent_section = """
                <div style="background: #ffebee; padding: 15px; border-radius: 6px; margin: 20px 0; border: 2px solid #f44336;">
                    <p style="margin: 0; color: #c62828; font-weight: bold; font-size: 18px;">⚠️ URGENT REQUEST - REQUIRES IMMEDIATE ATTENTION</p>
                </div>
                """
            
            external_contractor_admin_section = ""
            if maintenance_request.use_external_contractor:
                external_contractor_admin_section = f"""
                <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2196F3;">
                    <p style="margin: 0;"><strong>⚠️ External Contractor Request:</strong></p>
                    <p style="margin: 5px 0;">Homeowner wants to use an external contractor from outside the subdivision.</p>
                    <p style="margin: 5px 0;"><strong>Contractor Name:</strong> {maintenance_request.external_contractor_name}</p>
                    <p style="margin: 5px 0;"><strong>Contact:</strong> {maintenance_request.external_contractor_contact}</p>
                    {f'<p style="margin: 5px 0;"><strong>Company:</strong> {maintenance_request.external_contractor_company}</p>' if maintenance_request.external_contractor_company else ''}
                </div>
                """
            
            admin_html = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #2e6F40 0%, #4CAF50 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
                    <h1 style="margin: 0;">🔧 New Maintenance Request</h1>
                </div>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                    <p>Hello Admin,</p>
                    
                    <p>A new maintenance request has been submitted and requires your review.</p>
                    
                    {urgent_section}
                    
                    <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2e6F40;">
                        <h3 style="margin-top: 0; color: #2e6F40;">Request Details:</h3>
                        <p><strong>Homeowner:</strong> {homeowner_name} ({homeowner_email})</p>
                        <p><strong>Maintenance Type:</strong> {maintenance_request.get_maintenance_type_display()}</p>
                        <p><strong>Description:</strong> {maintenance_request.description}</p>
                        <p><strong>Preferred Date:</strong> {maintenance_request.preferred_date.strftime('%B %d, %Y')}</p>
                        <p><strong>Preferred Time:</strong> {maintenance_request.preferred_time.strftime('%I:%M %p')}</p>
                        <p><strong>Urgency:</strong> {'<span style="color: #f44336; font-weight: bold;">URGENT</span>' if maintenance_request.is_urgent else 'Normal'}</p>
                        <p><strong>Request ID:</strong> #{maintenance_request.id}</p>
                    </div>
                    
                    {external_contractor_admin_section}
                    
                    <p>Please review and approve or decline this request.</p>
                    <p><a href="{settings.FRONTEND_URL}/admin-maintenance-requests" style="background-color: #2e6F40; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Request</a></p>
                    
                    <p style="margin-top: 30px;">Thank you,<br><strong>Happy Homes System</strong></p>
                </div>
            </body>
            </html>
            """
            
            admin_plain = strip_tags(admin_html)
            
            send_mail(
                subject=admin_subject,
                message=admin_plain,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=admin_emails,
                html_message=admin_html,
                fail_silently=True,
            )
            print(f"[SUCCESS] Notification email sent to {len(admin_emails)} admin(s)")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to send creation emails: {e}")
        import traceback
        traceback.print_exc()
        return False


def send_maintenance_request_approval_email(maintenance_request):
    """
    Send approval email to homeowner
    """
    try:
        homeowner = maintenance_request.homeowner
        homeowner_email = homeowner.email
        homeowner_name = homeowner.first_name or homeowner.username
        
        if not homeowner_email:
            print(f"[WARNING] No email found for homeowner {homeowner.username}")
            return False
        
        subject = f"✅ Maintenance Request Approved - {maintenance_request.get_maintenance_type_display()}"
        
        approved_by_name = maintenance_request.approved_by.first_name or maintenance_request.approved_by.username if maintenance_request.approved_by else "Administrator"
        
        external_contractor_section = ""
        if maintenance_request.use_external_contractor:
            external_contractor_section = f"""
            <div style="background: #e7f3ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #2196F3;">
                <p style="margin: 0;"><strong>External Contractor Information:</strong></p>
                <p style="margin: 5px 0;">Your request to use an external contractor has been approved.</p>
                <p style="margin: 5px 0;"><strong>Contractor:</strong> {maintenance_request.external_contractor_name}</p>
                <p style="margin: 5px 0;"><strong>Contact:</strong> {maintenance_request.external_contractor_contact}</p>
            </div>
            """
        
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2e6F40 0%, #4CAF50 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
                <h1 style="margin: 0;">✅ Maintenance Request Approved</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Hello <strong>{homeowner_name}</strong>,</p>
                
                <p>Great news! Your maintenance request has been <strong style="color: #28a745;">approved</strong> by the administrator.</p>
                
                <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0; color: #2e6F40;">Request Details:</h3>
                    <p><strong>Maintenance Type:</strong> {maintenance_request.get_maintenance_type_display()}</p>
                    <p><strong>Description:</strong> {maintenance_request.description}</p>
                    <p><strong>Preferred Date:</strong> {maintenance_request.preferred_date.strftime('%B %d, %Y')}</p>
                    <p><strong>Preferred Time:</strong> {maintenance_request.preferred_time.strftime('%I:%M %p')}</p>
                    <p><strong>Approved By:</strong> {approved_by_name}</p>
                    <p><strong>Approved At:</strong> {maintenance_request.approved_at.strftime('%B %d, %Y at %I:%M %p') if maintenance_request.approved_at else 'N/A'}</p>
                </div>
                
                {external_contractor_section}
                
                <div style="background: #e8f5e9; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <p style="margin: 0;"><strong>Next Steps:</strong></p>
                    <ul style="margin: 5px 0;">
                        <li>Please ensure you're available on the scheduled date and time</li>
                        <li>If using an external contractor, coordinate with them directly</li>
                        <li>Contact the administration office if you need to reschedule</li>
                    </ul>
                </div>
                
                <p>You can view your request status at: <a href="{settings.FRONTEND_URL}/maintenance-request" style="color: #2e6F40; font-weight: bold;">View My Requests</a></p>
                
                <p style="margin-top: 30px;">Thank you,<br><strong>Happy Homes Community Management</strong></p>
            </div>
        </body>
        </html>
        """
        
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[homeowner_email],
            html_message=html_message,
            fail_silently=True,
        )
        
        print(f"[SUCCESS] Approval email sent to homeowner: {homeowner_email}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to send approval email: {e}")
        import traceback
        traceback.print_exc()
        return False


def send_maintenance_request_decline_email(maintenance_request):
    """
    Send decline email to homeowner with reason
    """
    try:
        homeowner = maintenance_request.homeowner
        homeowner_email = homeowner.email
        homeowner_name = homeowner.first_name or homeowner.username
        
        if not homeowner_email:
            print(f"[WARNING] No email found for homeowner {homeowner.username}")
            return False
        
        subject = f"❌ Maintenance Request Declined - {maintenance_request.get_maintenance_type_display()}"
        
        declined_by_name = maintenance_request.approved_by.first_name or maintenance_request.approved_by.username if maintenance_request.approved_by else "Administrator"
        
        declined_reason_section = ""
        if maintenance_request.declined_reason:
            declined_reason_section = f"""
            <div style="background: #ffebee; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <p style="margin: 0;"><strong>Reason for Decline:</strong></p>
                <p style="margin: 5px 0;">{maintenance_request.declined_reason}</p>
            </div>
            """
        
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
                <h1 style="margin: 0;">❌ Maintenance Request Declined</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Hello <strong>{homeowner_name}</strong>,</p>
                
                <p>We regret to inform you that your maintenance request has been <strong style="color: #dc3545;">declined</strong> by the administrator.</p>
                
                <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc3545;">
                    <h3 style="margin-top: 0; color: #2e6F40;">Request Details:</h3>
                    <p><strong>Maintenance Type:</strong> {maintenance_request.get_maintenance_type_display()}</p>
                    <p><strong>Description:</strong> {maintenance_request.description}</p>
                    <p><strong>Preferred Date:</strong> {maintenance_request.preferred_date.strftime('%B %d, %Y')}</p>
                    <p><strong>Preferred Time:</strong> {maintenance_request.preferred_time.strftime('%I:%M %p')}</p>
                    <p><strong>Declined By:</strong> {declined_by_name}</p>
                </div>
                
                {declined_reason_section}
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0;"><strong>What's Next?</strong></p>
                    <ul style="margin: 5px 0;">
                        <li>You can submit a new request with different details</li>
                        <li>Contact the administration office if you have questions</li>
                        <li>Review the reason for decline and adjust your request accordingly</li>
                    </ul>
                </div>
                
                <p>You can view your request status at: <a href="{settings.FRONTEND_URL}/maintenance-request" style="color: #2e6F40; font-weight: bold;">View My Requests</a></p>
                
                <p style="margin-top: 30px;">Thank you,<br><strong>Happy Homes Community Management</strong></p>
            </div>
        </body>
        </html>
        """
        
        plain_message = strip_tags(html_message)
        
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[homeowner_email],
            html_message=html_message,
            fail_silently=True,
        )
        
        print(f"[SUCCESS] Decline email sent to homeowner: {homeowner_email}")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to send decline email: {e}")
        import traceback
        traceback.print_exc()
        return False

