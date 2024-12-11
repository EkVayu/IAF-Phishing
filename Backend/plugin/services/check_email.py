import os
import logging
import re
import email
import requests
from email import policy
from django.conf import settings
from pathlib import Path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
import dkim
import spf
import dns.resolver
from plugin.models import EmailDetails, URL, Attachment, Content
import time
import ipaddress
from requests.adapters import HTTPAdapter, Retry
import requests
from .timing_logger import log_time
from urllib.parse import urlparse
from users.models import  RoughURL, RoughDomain, RoughMail
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define file path for email backups
FILE_PATH = Path(settings.EMAIL_BACKUP_DIR)

# Timeout threshold in seconds
AI_RESPONSE_TIMEOUT = 1
@log_time
def check_eml(eml_content, newpath_set, msg_id):
    try:
        msg = email.message_from_bytes(eml_content, policy=policy.default)
        return {
            'to_email': msg.get('To', '') or '',
            'from_email': msg.get('From', '') or '',
            'cc': msg.get('Cc', '') or '',
            'bcc': msg.get('Bcc', '') or '',
            'subject': msg.get('Subject', '') or '',
            'body': extract_body(msg) or "",
            'urls': extract_urls(eml_content) or [],
            'attachments': extract_attachments(msg, newpath_set)['attachments'],
        }
    except Exception as e:
        logger.error(f"Error extracting email details: {e}")
        return None
@log_time
def extract_body(msg):
    for part in msg.iter_parts():
        try:
            if part.get_content_type() == 'text/plain':
                # Decode the body content
                body = part.get_payload(decode=True)
                charset = part.get_content_charset() or 'utf-8'
                decoded_body = body.decode(charset, errors='ignore')
                # Return the plain text
                return decoded_body
            elif part.get_content_type() == 'text/html':
                # Optionally handle HTML parts similarly
                body = part.get_payload(decode=True)
                charset = part.get_content_charset() or 'utf-8'
                decoded_body = body.decode(charset, errors='ignore')
                return decoded_body
        except Exception as e:
            logger.error(f"Error processing email body part: {e}")
            continue
    return ""
@log_time
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
@log_time
def extract_urls(eml_content):
    url_regex = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
    urls = set()
    msg = email.message_from_bytes(eml_content, policy=email.policy.default)
    body = extract_body(msg)
    if body:
        urls.update(re.findall(url_regex, body))
    return list(urls)

def setup_dns_resolver():
    resolver = dns.resolver.Resolver()
    resolver.timeout = 2.0  # Reduced from 5.4s
    resolver.lifetime = 3.0
    resolver.nameservers = ['8.8.8.8', '8.8.4.4']  # Use Google DNS
    return resolver

@log_time
def verify_dkim(eml_content):
    try:
        resolver = setup_dns_resolver()
        headers = email.message_from_bytes(eml_content)
        if 'DKIM-Signature' not in headers:
            logger.info("No DKIM signature found")
            return False
        # Set custom resolver for dkim
        dns.resolver.default_resolver = resolver
        return dkim.verify(eml_content)
    except dns.exception.Timeout:
        logger.warning("DKIM DNS lookup timed out, using fallback check")
        return None
    except Exception as e:
        logger.error(f"Error in DKIM check: {e}")
        return False
@log_time
def get_sender_ip_from_eml(eml_content):
    msg = email.message_from_bytes(eml_content)
    ip_headers = ['X-Originating-IP', 'X-Sender-IP', 'Received-SPF', 'Authentication-Results', 'Received']
    for header in ip_headers:
        if header in msg:
            ip_match = re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', msg[header])
            if ip_match:
                return ip_match.group(0)
    return None
@log_time
def verify_spf(from_email, eml_content):
    sender_ip = get_sender_ip_from_eml(eml_content) or '127.0.0.1'
    domain = from_email.split('@')[-1].strip('>')
    if 'google.com' in domain:
        google_ips = ['209.85.220.0/24', '64.233.160.0/19', '66.102.0.0/20']
        for ip_range in google_ips:
            if ipaddress.ip_address(sender_ip) in ipaddress.ip_network(ip_range):
                return True
    result = spf.check(i=sender_ip, s=from_email, h=domain)
    logger.info(f"SPF check with IP {sender_ip} for domain: {domain}")
    return result[0] == 'pass'

@log_time
def verify_dmarc(from_email):
    try:
        domain = from_email.split('@')[-1].strip('>')
        resolver = dns.resolver.Resolver()
        resolver.timeout = 5
        resolver.lifetime = 5
        dmarc_record = resolver.resolve(f'_dmarc.{domain}', 'TXT')
        return any('v=DMARC1' in str(record) for record in dmarc_record)
    except Exception as e:
        logger.error(f"Error in DMARC check for {domain}: {e}")
        return False


@log_time
def is_valid_email(email):
    """Simple regex to check if the email format is valid."""
    # Extract email from format like "Name <email@example.com>"
    email_match = re.match(r'.*<(.+)>', email)  # Improved pattern to capture the email part
    if email_match:
        email = email_match.group(1)  # Extract the email address
    regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return re.match(regex, email) is not None

@log_time
def extract_email_from_string(email_string):
    """Extract email address from a string like 'Name <email@domain.com>'"""
    import re
    email_pattern = r'<(.+?)>|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
    match = re.search(email_pattern, email_string)
    return match.group(1) or match.group(2) if match else email_string


def extract_domain_from_url(url):
    """ Extract the domain from the URL. """
    try:
        parsed_url = urlparse(url)
        return parsed_url.netloc
    except Exception as e:
        return None

def check_existence_in_db(urls, domains, ips):
    # Check if any URL domain exists in the RoughURL table
    for url in urls:
        domain = extract_domain_from_url(url)
        if domain and RoughURL.objects.filter(url__icontains=domain).exists():  # Checking URL domain
            return 'unsafe'

    # Check if any domain exists in the RoughDomain table
    for domain in domains:
        if RoughDomain.objects.filter(ip__icontains=domain).exists():  # Assuming domain check is by IP
            return 'unsafe'
    
    # Check if any IP exists in the RoughMail table
    for ip in ips:
        try:
            ip_address = ipaddress.ip_address(ip)
            if RoughMail.objects.filter(mailid=ip_address).exists():  # Check IP in RoughMail (if needed)
                return 'unsafe'
        except ValueError:
            # If it's not a valid IP address, ignore and continue
            continue
    
    return 'safe'

@log_time
def check_external_apis(email_details, msg_id):
    logger.info(f"Starting AI check for message ID: {msg_id}")
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    })

    def send_request(url, payload, is_file=False):
        try:
            if is_file:
                response = requests.post(url, files=payload, timeout=10)
            else:
                response = session.post(url, json=payload, timeout=10)
            logger.info(f"AI Response received for {url}: {response.status_code} - {response.text}")
            return response
        except Exception as e:
            logger.error(f"AI Request Error: {e}")
            return "failed"

    try:
        # Content Check
        content_payload = {
            "row_id": msg_id,
            "msg_id": msg_id,
            "subject": email_details['subject'],
            "to_ids": [extract_email_from_string(email_details['to_email'])],
            "from_ids": [extract_email_from_string(email_details['from_email'])],
            "body": email_details['body']
        }
        
        content_response = send_request('http://192.168.0.2:6064/voxpd/process_content', content_payload)
        if isinstance(content_response, str):
            return "failed"
        
        content_data = content_response.json()
        if content_data.get('status') != 200:
            return "failed"

        # URL Check
        if email_details.get('urls'):
            valid_urls = [url.strip() for url in email_details['urls'] if url.strip().startswith('http')]
            if valid_urls:
                url_details = [{"url": url, "row_id": msg_id} for url in valid_urls]
                url_payload = {
                    "msg_id": msg_id,
                    "url_details": url_details
                }
                
                url_response = send_request('http://192.168.0.2:6061/voxpd/process_url', url_payload)
                if isinstance(url_response, str):
                    return "failed"
                
                url_data = url_response.json()
                if url_data.get('status') != 200:
                    return "failed"

        # Attachment Check
        if email_details.get('attachments'):
            for attachment in email_details['attachments']:
                attachment_payload = {
                    'attachment': (attachment, open(attachment, 'rb')),
                    'msg_id': (None, msg_id),
                    'row_id': (None, msg_id)
                }
                
                attachment_response = send_request(
                    'http://192.168.0.2:6065/voxpd/process_attachment',
                    attachment_payload,
                    is_file=True
                )

                
                if isinstance(attachment_response, str):
                    return "failed"
                    
                attachment_data = attachment_response.json()
                if attachment_data.get('status') != 200:
                    return "failed"
                


        return "Received"

    except Exception as e:
        logger.error(f"AI Analysis Error: {str(e)}")
        return "failed"


def check_email_authentication(from_email, eml_content, email_details, msg_id):
    start_time = time.time()
    
    # Add debug logging for each check
    dkim_check = verify_dkim(eml_content)
    logger.info(f"DKIM check result: {dkim_check}")
    
    spf_check = verify_spf(from_email, eml_content)
    logger.info(f"SPF check result: {spf_check}")
    
    dmarc_check = verify_dmarc(from_email)
    logger.info(f"DMARC check result: {dmarc_check}")
    
    # Get sender IP and domain for DB check
    sender_ip = get_sender_ip_from_eml(eml_content)
    domain = from_email.split('@')[-1].strip('>')
    
    db_check = check_existence_in_db(
        urls=email_details.get('urls', []),
        domains=[domain],
        ips=[sender_ip] if sender_ip else []
    )
    logger.info(f"Database check result: {db_check}")
    
    external_status = check_external_apis(email_details, msg_id)
    logger.info(f"External API check result: {external_status}")
    
    # Log all check results together
    logger.info(f"All security checks - DKIM: {dkim_check}, SPF: {spf_check}, "
               f"DMARC: {dmarc_check}, DB: {db_check}, External: {external_status}")
    
    if all([
        dkim_check, 
        spf_check, 
        dmarc_check, 
        db_check == 'safe',
        external_status == 'safe'
    ]):
        return "safe"
    return "unsafe"

@csrf_exempt
@transaction.atomic
def check_email(request):
    try:
        logger.info("Processing check_email request")
        start_time = time.time()

        msg_id = request.POST.get('messageId')
        plugin_id = request.POST.get('pluginId')
        browser = request.POST.get('browser')
        ipv4 = request.POST.get('ipv4')
        uploaded_file = request.FILES.get('file')

        if not msg_id:
            return JsonResponse({"message": "Please provide message Id", "STATUS": "Not Found", "Code": 0})

        existing_email = EmailDetails.objects.filter(msg_id=msg_id).first()
        if existing_email:
            return JsonResponse({
                "message": "Email already exists",
                "messageId": msg_id,
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
            simplified_eml_filename = f"{sanitized_msg_id}_simplified.eml"
            simplified_eml_path = newpath_set / simplified_eml_filename
            simplified_msg = MIMEMultipart('alternative')  # Use 'alternative' instead of default mixed
            simplified_msg['From'] = email_details['from_email']
            simplified_msg['To'] = email_details['to_email']
            simplified_msg['Subject'] = email_details['subject']
            simplified_msg['Date'] = formatdate(localtime=True)
            text_part = MIMEText(email_details['body'], 'plain', 'utf-8')
            text_part.replace_header('Content-Transfer-Encoding', '8bit')
            simplified_msg.attach(text_part)
            with open(simplified_eml_path, 'wb') as simplified_file:
                simplified_msg['MIME-Version'] = '1.0'
                simplified_msg['Content-Type'] = 'text/plain; charset="utf-8"'
                simplified_file.write(simplified_msg.as_bytes())
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
                status="pending"
            )
            email_entry.save()

            # First get AI analysis status
            ai_status = check_external_apis(email_details, msg_id)
            logger.info(f"Initial AI Analysis Status: {ai_status}")
            
            # Only check authentication if AI check is safe
            if ai_status == "safe":
                auth_status = check_email_authentication(
                    email_details['from_email'],
                    eml_content,
                    email_details,
                    msg_id
                )
                logger.info(f"Authentication Status: {auth_status}")
                final_status = auth_status
            else:
                final_status = ai_status

            logger.info(f"Setting Final Status: {final_status}")
            
            email_entry.status = final_status
            email_entry.save()
            
            Content.objects.create(
           email_detail=email_entry,
           recievers_email=email_details['to_email'],
           subject=email_details['subject'],
           senders_email=email_details['from_email'],
           body=email_details['body']

           )
            for url in email_details['urls']:
                URL.objects.create(email_detail=email_entry, url=url)
             
            for attachment in email_details['attachments']:
                    Attachment.objects.create(email_detail=email_entry, attachment=attachment,)

            return JsonResponse({
                "message": "Email processed successfully",
                "STATUS": "Success",
                "Code": 1,
                "email_status": final_status,
                "messageId": msg_id,
            })

        return JsonResponse({"error": "No file received"}, status=400)

    except Exception as e:
        logger.error(f"Error in check_email: {e}", exc_info=True)
        return JsonResponse({"error": f"Internal Server Error: {str(e)}"}, status=500)
