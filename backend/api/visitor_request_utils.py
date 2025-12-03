"""
Utility functions for Visitor Request PDF generation and email sending
"""
import os
from io import BytesIO
from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone
from django.template.loader import render_to_string
from django.http import HttpResponse
from datetime import datetime
import io

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def generate_visitor_request_pdf(visitor_request):
    """
    Generate a formal, modern PDF document for a visitor request with all details
    Returns the PDF file path or None if generation fails
    """
    if not REPORTLAB_AVAILABLE:
        # Fallback: Create a simple text-based document
        return _generate_simple_text_document(visitor_request)
    
    try:
        # Create PDF in memory first
        buffer = BytesIO()
        
        # Create the PDF object with professional margins
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=50,
            leftMargin=50,
            topMargin=80,
            bottomMargin=50
        )
        
        # Container for PDF elements
        elements = []
        styles = getSampleStyleSheet()
        
        # ========== HEADER SECTION ==========
        # Company Header with formal styling
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=colors.HexColor('#2e6F40'),
            spaceAfter=8,
            alignment=1,  # Center
            fontName='Helvetica-Bold'
        )
        
        subheader_style = ParagraphStyle(
            'SubHeaderStyle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#666666'),
            spaceAfter=30,
            alignment=1,
            fontName='Helvetica'
        )
        
        # Header
        header = Paragraph("HAPPY HOMES", header_style)
        elements.append(header)
        
        subheader = Paragraph("Community Management System", subheader_style)
        elements.append(subheader)
        
        # Divider line
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2e6F40'), spaceAfter=20, spaceBefore=10))
        
        # Document Title
        title_style = ParagraphStyle(
            'DocumentTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=25,
            alignment=1,
            fontName='Helvetica-Bold'
        )
        
        doc_title = Paragraph("VISITOR AUTHORIZATION DOCUMENT", title_style)
        elements.append(doc_title)
        elements.append(Spacer(1, 0.3*inch))
        
        # ========== STATUS BADGE ==========
        status_bg_color = colors.HexColor('#28a745') if visitor_request.status == 'approved' else colors.HexColor('#dc3545')
        status_text_color = colors.white
        
        status_data = [[
            Paragraph(
                f"<b><font color='{status_text_color.hexval()}' size='14'>{visitor_request.get_status_display().upper()}</font></b>",
                ParagraphStyle('Status', parent=styles['Normal'], alignment=1, fontName='Helvetica-Bold')
            )
        ]]
        
        status_table = Table(status_data, colWidths=[6*inch])
        status_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), status_bg_color),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [status_bg_color]),
        ]))
        
        elements.append(status_table)
        elements.append(Spacer(1, 0.4*inch))
        
        # ========== SECTION STYLES ==========
        section_title_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2e6F40'),
            spaceAfter=12,
            spaceBefore=15,
            fontName='Helvetica-Bold',
            borderWidth=0,
            borderPadding=0,
            leftIndent=0
        )
        
        label_style = ParagraphStyle(
            'LabelStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#555555'),
            fontName='Helvetica-Bold',
            leftIndent=0
        )
        
        value_style = ParagraphStyle(
            'ValueStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#1a1a1a'),
            fontName='Helvetica',
            leftIndent=0
        )
        
        # ========== VISITOR INFORMATION SECTION ==========
        elements.append(Paragraph("VISITOR INFORMATION", section_title_style))
        
        visitor_data = [
            [Paragraph("<b>Full Name:</b>", label_style), Paragraph(visitor_request.visitor_name, value_style)],
            [Paragraph("<b>Email Address:</b>", label_style), Paragraph(visitor_request.visitor_email, value_style)],
            [Paragraph("<b>Contact Number:</b>", label_style), Paragraph(visitor_request.visitor_contact_number or 'Not provided', value_style)],
            [Paragraph("<b>Purpose of Visit:</b>", label_style), Paragraph(visitor_request.reason or 'Not specified', value_style)],
        ]
        
        visitor_table = Table(visitor_data, colWidths=[2.2*inch, 3.8*inch])
        visitor_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
        ]))
        
        elements.append(visitor_table)
        elements.append(Spacer(1, 0.35*inch))
        
        # ========== ACCESS CREDENTIALS SECTION ==========
        elements.append(Paragraph("ACCESS CREDENTIALS", section_title_style))
        
        # Format date and time professionally
        visit_date_str = visitor_request.visit_date.strftime('%A, %B %d, %Y')
        start_time_str = visitor_request.visit_start_time.strftime('%I:%M %p').lstrip('0')
        end_time_str = visitor_request.visit_end_time.strftime('%I:%M %p').lstrip('0')
        
        # Handle multi-day visits
        if visitor_request.visit_end_date and visitor_request.visit_end_date != visitor_request.visit_date:
            end_date_str = visitor_request.visit_end_date.strftime('%A, %B %d, %Y')
            date_range = f"{visit_date_str} to {end_date_str}"
        else:
            date_range = visit_date_str
        
        # PIN Display with emphasis
        pin_display = Paragraph(
            f"<b><font size='24' color='#2e6F40' letterSpacing='4'>{visitor_request.one_time_pin or 'N/A'}</font></b>",
            ParagraphStyle('PINStyle', parent=styles['Normal'], fontSize=24, textColor=colors.HexColor('#2e6F40'), alignment=1, fontName='Helvetica-Bold', spaceAfter=8)
        )
        
        access_data = [
            [Paragraph("<b>One-Time Access PIN:</b>", label_style), pin_display],
            [Paragraph("<b>Authorized Visit Date(s):</b>", label_style), Paragraph(date_range, value_style)],
            [Paragraph("<b>Valid Time Window:</b>", label_style), Paragraph(f"{start_time_str} to {end_time_str}", value_style)],
        ]
        
        access_table = Table(access_data, colWidths=[2.2*inch, 3.8*inch])
        access_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f5e9')),
            ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#f0fdf4')),  # PIN row background
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('VALIGN', (1, 0), (1, 0), 'MIDDLE'),  # Center PIN vertically
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#c3e6cb')),
        ]))
        
        elements.append(access_table)
        elements.append(Spacer(1, 0.35*inch))
        
        # ========== RESIDENT INFORMATION SECTION ==========
        elements.append(Paragraph("RESIDENT INFORMATION", section_title_style))
        
        homeowner_name = f"{visitor_request.resident.first_name} {visitor_request.resident.last_name}".strip() or visitor_request.resident.username
        
        homeowner_data = [
            [Paragraph("<b>Resident Name:</b>", label_style), Paragraph(homeowner_name, value_style)],
            [Paragraph("<b>Username:</b>", label_style), Paragraph(visitor_request.resident.username, value_style)],
            [Paragraph("<b>Email Address:</b>", label_style), Paragraph(visitor_request.resident.email, value_style)],
        ]
        
        homeowner_table = Table(homeowner_data, colWidths=[2.2*inch, 3.8*inch])
        homeowner_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8f9fa')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e0e0e0')),
        ]))
        
        elements.append(homeowner_table)
        elements.append(Spacer(1, 0.35*inch))
        
        # ========== APPROVAL INFORMATION SECTION ==========
        if visitor_request.status == 'approved' and visitor_request.approved_by:
            elements.append(Paragraph("AUTHORIZATION INFORMATION", section_title_style))
            
            approved_by_name = f"{visitor_request.approved_by.first_name} {visitor_request.approved_by.last_name}".strip() or visitor_request.approved_by.username
            approved_at_str = visitor_request.approved_at.strftime('%A, %B %d, %Y at %I:%M %p').lstrip('0') if visitor_request.approved_at else 'N/A'
            
            approval_data = [
                [Paragraph("<b>Authorized By:</b>", label_style), Paragraph(approved_by_name, value_style)],
                [Paragraph("<b>Authorization Date:</b>", label_style), Paragraph(approved_at_str, value_style)],
            ]
            
            approval_table = Table(approval_data, colWidths=[2.2*inch, 3.8*inch])
            approval_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8f5e9')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('ALIGN', (1, 0), (1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#c3e6cb')),
            ]))
            
            elements.append(approval_table)
            elements.append(Spacer(1, 0.35*inch))
        
        # ========== TERMS AND CONDITIONS SECTION ==========
        elements.append(Paragraph("TERMS AND CONDITIONS", section_title_style))
        
        terms_style = ParagraphStyle(
            'TermsStyle',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#555555'),
            spaceAfter=6,
            leftIndent=0,
            fontName='Helvetica'
        )
        
        terms_text = """
        <b>1.</b> This document serves as official authorization for the visitor's entry into the community premises.<br/>
        <b>2.</b> The one-time access PIN is valid only during the specified date and time window.<br/>
        <b>3.</b> The PIN will automatically expire after the authorized visit end time.<br/>
        <b>4.</b> The resident is responsible for ensuring the visitor's compliance with community rules and regulations.<br/>
        <b>5.</b> This authorization may be revoked at any time by community administration.<br/>
        <b>6.</b> The visitor must present valid identification upon request by security personnel.<br/>
        <b>7.</b> Unauthorized use of this PIN is strictly prohibited and may result in legal action.
        """
        
        terms = Paragraph(terms_text, terms_style)
        elements.append(terms)
        elements.append(Spacer(1, 0.4*inch))
        
        # ========== FOOTER SECTION ==========
        footer_divider = HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e0e0e0'), spaceAfter=10, spaceBefore=10)
        elements.append(footer_divider)
        
        footer_style = ParagraphStyle(
            'FooterStyle',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#999999'),
            alignment=1,
            fontName='Helvetica',
            spaceAfter=5
        )
        
        footer_text = f"Document Generated: {timezone.now().strftime('%B %d, %Y at %I:%M %p')} | Happy Homes Community Management System | Request ID: {visitor_request.id}"
        footer = Paragraph(footer_text, footer_style)
        elements.append(footer)
        
        copyright_text = "© Happy Homes Community Management System. This is an official document. Unauthorized reproduction is prohibited."
        copyright = Paragraph(copyright_text, footer_style)
        elements.append(copyright)
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF content
        pdf_content = buffer.getvalue()
        buffer.close()
        
        # Save to file
        pdf_filename = f"visitor_request_{visitor_request.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        pdf_path = os.path.join(settings.MEDIA_ROOT, 'visitor_request_pdfs', pdf_filename)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
        
        # Write PDF to file
        with open(pdf_path, 'wb') as f:
            f.write(pdf_content)
        
        # Return relative path from MEDIA_ROOT
        relative_path = os.path.join('visitor_request_pdfs', pdf_filename)
        return relative_path
        
    except Exception as e:
        print(f"[ERROR] Failed to generate PDF for visitor request {visitor_request.id}: {e}")
        import traceback
        traceback.print_exc()
        return None


def _generate_simple_text_document(visitor_request):
    """
    Fallback: Generate a simple text document if reportlab is not available
    """
    try:
        content = f"""
VISITOR REQUEST PROFILE
========================

Status: {visitor_request.get_status_display().upper()}

VISITOR INFORMATION
-------------------
Visitor Name: {visitor_request.visitor_name}
Email: {visitor_request.visitor_email}
Contact Number: {visitor_request.visitor_contact_number or 'N/A'}
Reason for Visit: {visitor_request.reason or 'N/A'}

ACCESS INFORMATION
------------------
One-Time PIN: {visitor_request.one_time_pin or 'N/A'}
Visit Date: {visitor_request.visit_date.strftime('%B %d, %Y')}
Valid Time: {visitor_request.visit_start_time.strftime('%I:%M %p')} - {visitor_request.visit_end_time.strftime('%I:%M %p')}

HOMEOWNER INFORMATION
---------------------
Homeowner Name: {visitor_request.resident.first_name} {visitor_request.resident.last_name}
Username: {visitor_request.resident.username}
Email: {visitor_request.resident.email}

APPROVAL INFORMATION
--------------------
Approved By: {visitor_request.approved_by.username if visitor_request.approved_by else 'N/A'}
Approval Date: {visitor_request.approved_at.strftime('%B %d, %Y at %I:%M %p') if visitor_request.approved_at else 'N/A'}

IMPORTANT NOTES
---------------
- This is a one-time access PIN valid only for the specified date and time.
- The PIN expires after the visit end time.
- Please ensure the visitor arrives during the specified time window.
- This document serves as official authorization for the visit.

Generated on {timezone.now().strftime('%B %d, %Y at %I:%M %p')}
Happy Homes Community Management System
"""
        
        # Save as text file
        txt_filename = f"visitor_request_{visitor_request.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.txt"
        txt_path = os.path.join(settings.MEDIA_ROOT, 'visitor_request_pdfs', txt_filename)
        os.makedirs(os.path.dirname(txt_path), exist_ok=True)
        
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        relative_path = os.path.join('visitor_request_pdfs', txt_filename)
        return relative_path
        
    except Exception as e:
        print(f"[ERROR] Failed to generate text document: {e}")
        return None


def send_visitor_request_approval_email(visitor_request):
    """
    Send approval email to homeowner with PDF attachment
    """
    try:
        if not visitor_request.pdf_file_path:
            print(f"[WARNING] No PDF file found for visitor request {visitor_request.id}")
            return False
        
        # Prepare email
        subject = f"✅ Visitor Request Approved - {visitor_request.visitor_name}"
        
        # Create HTML email body
        html_message = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2e6F40 0%, #4CAF50 100%); padding: 20px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
                <h1 style="margin: 0;">✅ Visitor Request Approved</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Hello <strong>{visitor_request.resident.first_name or visitor_request.resident.username}</strong>,</p>
                
                <p>Great news! Your visitor request has been <strong style="color: #28a745;">approved</strong> by the administrator.</p>
                
                <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="margin-top: 0; color: #2e6F40;">Visitor Details:</h3>
                    <p><strong>Visitor Name:</strong> {visitor_request.visitor_name}</p>
                    <p><strong>Email:</strong> {visitor_request.visitor_email}</p>
                    <p><strong>Contact Number:</strong> {visitor_request.visitor_contact_number or 'N/A'}</p>
                    <p><strong>Visit Date:</strong> {visitor_request.visit_date.strftime('%B %d, %Y')}</p>
                    <p><strong>Valid Time:</strong> {visitor_request.visit_start_time.strftime('%I:%M %p')} - {visitor_request.visit_end_time.strftime('%I:%M %p')}</p>
                </div>
                
                <div style="background: #e8f5e9; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center; border: 2px solid #28a745;">
                    <h2 style="margin: 0; color: #2e6F40;">One-Time PIN</h2>
                    <p style="font-size: 32px; font-weight: bold; margin: 10px 0; letter-spacing: 5px; color: #2e6F40;">
                        {visitor_request.one_time_pin}
                    </p>
                    <p style="font-size: 12px; color: #666; margin: 0;">
                        Valid only on {visitor_request.visit_date.strftime('%B %d, %Y')} from {visitor_request.visit_start_time.strftime('%I:%M %p')} to {visitor_request.visit_end_time.strftime('%I:%M %p')}
                    </p>
                </div>
                
                <p><strong>Please share this PIN with your visitor before their visit.</strong></p>
                
                <p>Please find the official visitor profile PDF attached to this email for your records.</p>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0;"><strong>Important:</strong></p>
                    <ul style="margin: 5px 0;">
                        <li>This is a one-time access PIN</li>
                        <li>The PIN expires after the visit end time</li>
                        <li>Please ensure your visitor arrives during the specified time window</li>
                    </ul>
                </div>
                
                <p style="margin-top: 30px;">Thank you,<br><strong>Happy Homes Community Management</strong></p>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        plain_message = f"""
Visitor Request Approved

Hello {visitor_request.resident.first_name or visitor_request.resident.username},

Great news! Your visitor request has been approved by the administrator.

Visitor Details:
- Visitor Name: {visitor_request.visitor_name}
- Email: {visitor_request.visitor_email}
- Contact Number: {visitor_request.visitor_contact_number or 'N/A'}
- Visit Date: {visitor_request.visit_date.strftime('%B %d, %Y')}
- Valid Time: {visitor_request.visit_start_time.strftime('%I:%M %p')} - {visitor_request.visit_end_time.strftime('%I:%M %p')}

One-Time PIN: {visitor_request.one_time_pin}

Valid only on {visitor_request.visit_date.strftime('%B %d, %Y')} from {visitor_request.visit_start_time.strftime('%I:%M %p')} to {visitor_request.visit_end_time.strftime('%I:%M %p')}

Please share this PIN with your visitor before their visit.

Please find the official visitor profile PDF attached to this email for your records.

Important:
- This is a one-time access PIN
- The PIN expires after the visit end time
- Please ensure your visitor arrives during the specified time window

Thank you,
Happy Homes Community Management
"""
        
        # Create email
        email = EmailMessage(
            subject=subject,
            body=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[visitor_request.resident.email],
        )
        
        # Attach PDF
        pdf_path = visitor_request.pdf_file_path.path
        if os.path.exists(pdf_path):
            email.attach_file(pdf_path)
        
        # Send email
        email.send(fail_silently=False)
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to send approval email: {e}")
        import traceback
        traceback.print_exc()
        return False

