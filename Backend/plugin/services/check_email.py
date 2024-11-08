import os
import logging
import re
import email
from email import policy
from django.conf import settings
from pathlib import Path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
import dkim
import spf
import dns.resolver
from plugin.models import EmailDetails, URL, RoughURL, RoughDomain, RoughMail, Attachment
import time  # Added for timeout handling

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define file path for email backups
FILE_PATH = Path(settings.EMAIL_BACKUP_DIR)

# Timeout threshold in seconds (e.g., 30 seconds)
AI_RESPONSE_TIMEOUT = 30

# Function to extract email details from .eml file
def check_eml(eml_content, newpath_set, msg_id):
    try:
        msg = email.message_from_bytes(eml_content, policy=policy.default)

        # Extract headers
        to_email = msg.get('To', '') or ''
        from_email = msg.get('From', '') or ''
        cc = msg.get('Cc', '') or ''
        bcc = msg.get('Bcc', '') or ''
        subject = msg.get('Subject', '') or ''

        # Extract body and attachments
        body = extract_body(msg) or ""
        attachment_info = extract_attachments(msg, newpath_set)

        # Extract URLs
        urls = extract_urls(eml_content) or []

        return {
            'to_email': to_email,
            'from_email': from_email,
            'cc': cc,
            'bcc': bcc,
            'subject': subject,
            'body': body,
            'urls': urls,
            'attachments': attachment_info['attachments'],
        }

    except Exception as e:
        logger.error(f"Error extracting email details: {e}")
        return None

# Extract body of the email (for simplicity, just text/plain or text/html)
def extract_body(msg):
    for part in msg.iter_parts():
        if part.get_content_type() == 'text/plain':
            return part.get_payload(decode=True).decode(part.get_content_charset(), errors='ignore')
        elif part.get_content_type() == 'text/html':
            return part.get_payload(decode=True).decode(part.get_content_charset(), errors='ignore')
    return ""

# Extract attachments from the email
def extract_attachments(msg, newpath_set):
    attachments = []
    for part in msg.iter_parts():
        if part.get_content_disposition() == 'attachment':
            filename = part.get_filename()
            if filename:
                file_path = newpath_set / filename
                with open(file_path, 'wb') as f:
                    f.write(part.get_payload(decode=True))
                attachments.append(filename)
    return {'attachments': attachments}

# Extract URLs from the email content
def extract_urls(eml_content):
    url_regex = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'  # Regex to match URLs
    urls = set()  # Use a set to avoid duplicate URLs
    msg = email.message_from_bytes(eml_content, policy=email.policy.default)
    body = extract_body(msg)
    
    if body:
        urls.update(re.findall(url_regex, body))

    return list(urls)

# Function to perform DKIM, SPF, and DMARC checks on the email
def check_email_authentication(from_email, eml_content):
    dkim_check = verify_dkim(eml_content)
    logger.info(f"DKIM check result: {'pass' if dkim_check else 'fail'}")
    spf_check = verify_spf(from_email)
    logger.info(f"SPF check result: {'pass' if spf_check else 'fail'}")
    
    dmarc_check = verify_dmarc(from_email)
    logger.info(f"DMARC check result: {'pass' if dmarc_check else 'fail'}")
   
    return "safe" if dkim_check and spf_check and dmarc_check else "unsafe"

# DKIM Verification
def verify_dkim(eml_content):
    try:
        return dkim.verify(eml_content)
    except Exception as e:
        logger.error(f"Error in DKIM check: {e}")
        return False

# SPF Verification
def verify_spf(from_email):
    try:
        ip = '127.0.0.1'  # This is a dummy IP. Replace with the sender's IP if available.
        domain = from_email.split('@')[-1]
        result = spf.check(i=ip, s=from_email, h=domain)
        return result[0] == 'pass'
    except Exception as e:
        logger.error(f"Error in SPF check: {e}")
        return False

# DMARC Verification
def verify_dmarc(from_email):
    try:
        domain = from_email.split('@')[-1]
        dmarc_record = dns.resolver.resolve(f'_dmarc.{domain}', 'TXT')
        return bool(dmarc_record)
    except dns.resolver.NoAnswer:
        logger.error(f"No DMARC record found for domain {domain}")
        return False
    except dns.resolver.NXDOMAIN:
        logger.error(f"Domain {domain} does not exist")
        return False
    except Exception as e:
        logger.error(f"Error in DMARC check: {e}")
        return False

# Check RoughURL, RoughDomain, and RoughMail database validations
def check_rough_data(email_details):
    for url in email_details['urls']:
        protocol = 'https' if url.startswith('https://') else 'http' if url.startswith('http://') else ''
        if not RoughURL.objects.filter(url=url, protocol=protocol).exists():
            logger.warning(f"URL {url} with protocol {protocol} not found in RoughURL.")
            return False
    
    domain = email_details['from_email'].split('@')[-1]
    if not RoughDomain.objects.filter(ip=domain).exists():
        logger.warning(f"Domain {domain} not found in RoughDomain.")
        return False
    
    if not RoughMail.objects.filter(mailid=email_details['from_email']).exists():
        logger.warning(f"Email {email_details['from_email']} not found in RoughMail.")
        return False
    
    return True

# Django view to check the email
@csrf_exempt
@transaction.atomic
def check_email(request):
    try:
        logger.info("Processing check_email request")

        # Start time tracking for AI response
        start_time = time.time()

        # Extract request parameters
        msg_id = request.POST.get('messageId')
        plugin_id = request.POST.get('pluginId')
        browser = request.POST.get('browser')
        ipv4 = request.POST.get('ipv4')
        uploaded_file = request.FILES.get('file')

        if not msg_id:
            return JsonResponse({"message": "Please provide message Id", "STATUS": "Not Found", "Code": 0})

        # Check if email already exists
        existing_email = EmailDetails.objects.filter(msg_id=msg_id).first()
        if existing_email:
            return JsonResponse({
                "message": "Email already exists",
                "STATUS": "Found",
                "Code": 1,
                "email_status": existing_email.status
            })

        sanitized_msg_id = msg_id.replace("\\", "_").replace("/", "_").replace(":", "_")
        newpath_set = FILE_PATH / sanitized_msg_id

        os.makedirs(newpath_set, exist_ok=True)

        if uploaded_file:
            eml_content = uploaded_file.read()
            eml_filename = f"{sanitized_msg_id}.eml"
            backup_saved_file_path = newpath_set / eml_filename

            with open(backup_saved_file_path, 'wb') as backup_file:
                backup_file.write(eml_content)

            email_details = check_eml(eml_content, newpath_set, sanitized_msg_id)
            if not email_details:
                return JsonResponse({"error": "Failed to extract email details"}, status=400)

            email_entry = EmailDetails(
                msg_id=msg_id,
                plugin_id=plugin_id,
                browser=browser,
                ipv4=ipv4,
                subject=email_details['subject'],
                senders_email=email_details['from_email'],
                recievers_email=email_details['to_email'],
                eml_file_name=eml_filename,
                email_body=email_details['body'],
                cc=email_details['cc'],
                bcc=email_details['bcc'],
                urls=email_details['urls'],
                attachments=email_details['attachments'],
                status="pending"  # Initially mark as pending
            )
            email_entry.save()

            email_status = check_email_authentication(email_details['from_email'], eml_content)
            
            # Perform database validation for RoughURL, RoughDomain, RoughMail
            if not check_rough_data(email_details):
                email_entry.status = "unsafe"
                email_entry.save()
                return JsonResponse({
                    "message": "Email failed database validation checks",
                    "STATUS": "Unsafe",
                    "Code": 1
                })

            # Check AI response time
            elapsed_time = time.time() - start_time
            if elapsed_time > AI_RESPONSE_TIMEOUT:
                logger.warning(f"AI response time exceeded the timeout of {AI_RESPONSE_TIMEOUT} seconds.")
                email_entry.status = "pending"
                email_entry.save()

            if email_status == "safe":
                email_entry.status = "safe"
            else:
                email_entry.status = "unsafe"
            email_entry.save()

            # Save URLs in URL model
            for url in email_details['urls']:
                URL.objects.create(email_detail=email_entry, url=url)

            # Save Attachments in Attachment model (Assuming an Attachment model exists)
            for attachment_filename in email_details['attachments']:
                Attachment.objects.create(email_detail=email_entry, filename=attachment_filename)

            return JsonResponse({
                "message": "Email processed successfully",
                "STATUS": "Success",
                "Code": 1,
                "email_status": email_entry.status,
                "messageId": msg_id,
            })

        return JsonResponse({"error": "No file received"}, status=400)

    except Exception as e:
        logger.error(f"Error in check_email: {e}", exc_info=True)
        return JsonResponse({"error": f"Internal Server Error: {str(e)}"}, status=500)