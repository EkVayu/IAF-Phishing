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
from plugin.models import EmailDetails, URL, RoughURL, RoughDomain, RoughMail, Attachment
import time
import ipaddress
from requests.adapters import HTTPAdapter, Retry
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define file path for email backups
FILE_PATH = Path(settings.EMAIL_BACKUP_DIR)

# Timeout threshold in seconds
AI_RESPONSE_TIMEOUT = 1

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

def extract_body(msg):
    for part in msg.iter_parts():
        if part.get_content_type() == 'text/plain':
            return part.get_payload(decode=True).decode(part.get_content_charset(), errors='ignore')
        elif part.get_content_type() == 'text/html':
            return part.get_payload(decode=True).decode(part.get_content_charset(), errors='ignore')
    return ""

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

def extract_urls(eml_content):
    url_regex = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'
    urls = set()
    msg = email.message_from_bytes(eml_content, policy=email.policy.default)
    body = extract_body(msg)
    if body:
        urls.update(re.findall(url_regex, body))
    return list(urls)

def verify_dkim(eml_content):
    try:
        headers = email.message_from_bytes(eml_content)
        if 'DKIM-Signature' not in headers:
            logger.info("No DKIM signature found")
            return False
        return dkim.verify(eml_content)
    except Exception as e:
        logger.error(f"Error in DKIM check: {e}")
        return False

def get_sender_ip_from_eml(eml_content):
    msg = email.message_from_bytes(eml_content)
    ip_headers = ['X-Originating-IP', 'X-Sender-IP', 'Received-SPF', 'Authentication-Results', 'Received']
    for header in ip_headers:
        if header in msg:
            ip_match = re.search(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', msg[header])
            if ip_match:
                return ip_match.group(0)
    return None

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



def is_valid_email(email):
    """Simple regex to check if the email format is valid."""
    # Extract email from format like "Name <email@example.com>"
    email_match = re.match(r'.*<(.+)>', email)  # Improved pattern to capture the email part
    if email_match:
        email = email_match.group(1)  # Extract the email address
    regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return re.match(regex, email) is not None

def check_external_apis(email_details, msg_id):
    status = "safe"
    BASE_URL = 'http://192.168.0.2:6061'  # Ensure this is the correct base URL
    max_retries = 3  # Retry limit
    session = requests.Session()
    
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    })

    def send_request_with_retry(url, payload, retries=0):
        """Helper function to send requests with retries."""
        try:
            response = session.post(url, json=payload, timeout=10)
            
            # Log the response from the API
            logger.info(f"Received response for {url}: {response.status_code} - {response.text}")
            
            if response.status_code == 403:
                logger.warning(f"Received 403 Forbidden response for {url} (retrying {retries + 1}/{max_retries})...")
                if retries < max_retries:
                    time.sleep(2 ** retries)  # Exponential backoff
                    return send_request_with_retry(url, payload, retries + 1)
                else:
                    logger.error(f"API denied access for {url} after {max_retries} retries.")
                    raise requests.exceptions.RequestException(f"Received 403 response after {max_retries} retries.")
            
            if response.status_code != 200:
                raise requests.exceptions.RequestException(f"Received non-200 response: {response.status_code}")
            
            return response
        
        except requests.exceptions.Timeout:
            if retries < max_retries:
                logger.warning(f"Timeout occurred, retrying ({retries + 1}/{max_retries})...")
                time.sleep(2 ** retries)  # Exponential backoff
                return send_request_with_retry(url, payload, retries + 1)
            else:
                logger.error(f"API timeout for msg_id: {msg_id} after {max_retries} retries.")
                raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Request Error: {e}")
            raise

    # Validate email addresses
    if not is_valid_email(email_details['from_email']):
        logger.error(f"Invalid 'from_email' format: {email_details['from_email']}")
        return "unsafe"  # Or handle the status based on your business logic
    if not is_valid_email(email_details['to_email']):
        logger.error(f"Invalid 'to_email' format: {email_details['to_email']}")
        return "unsafe"  # Or handle the status based on your business logic

    try:
        # 1. Content Check
        content_payload = {
            "msg_id": msg_id,
            "subject": email_details['subject'],
            "from_ids": [email_details['from_email']],
            "to_ids": [email_details['to_email']],
            "body": email_details['body'],
            "url": email_details.get('urls', []),
        }
        logger.error(f"Sending content payload jeevan : {content_payload}")

        content_response = send_request_with_retry(
            f'http://192.168.0.2:6064/voxpd/process_content', content_payload
        )
        logger.info(f"Raw Content API Response: {content_response.text}")

        if content_response.text:
            content_data = content_response.json()
            logger.info(f"Parsed Content API Response: {content_data}")
            if content_data.get('status') == 200 and content_data.get('data', {}).get('result') == 'unsafe':
                status = "unsafe"

        # 2. URL Check
        if email_details.get('urls'):
            valid_urls = [url for url in email_details['urls'] if url.startswith('http')]
            if not valid_urls:
                logger.warning("No valid URLs found in the email.")
                return "unsafe"  # Handle the case when no valid URLs are present
                
            for url in valid_urls:
                url_payload = {"msg_id": msg_id, "urls": [url]}
                logger.info(f"Sending URL payload: {url_payload}")
                
                url_response = send_request_with_retry(
                    f'http://192.168.0.2:6061/voxpd/process_url', url_payload
                )
                logger.info(f"Raw URL API Response for {url}: {url_response.text}")

                if url_response.text:
                    url_data = url_response.json()
                    logger.info(f"Parsed URL API Response: {url_data}")
                    if url_data.get('status') == 200 and url_data.get('data', {}).get('result') == 'unsafe':
                        status = "unsafe"
        

    except Exception as e:
        logger.error(f"Unexpected Error: {e}")
        status = "pending"  # Save as pending for unexpected errors

    return status

    return status # Save as pending for unexpected errors
def check_email_authentication(from_email, eml_content, email_details, msg_id):
    start_time = time.time()
    
    dkim_check = verify_dkim(eml_content)
    spf_check = verify_spf(from_email, eml_content)
    dmarc_check = verify_dmarc(from_email)
    
    if (time.time() - start_time) > AI_RESPONSE_TIMEOUT:
        logger.warning("Security checks timeout - marking as pending")
        return "pending"
    
    external_status = check_external_apis(email_details, msg_id)
    if (time.time() - start_time) > AI_RESPONSE_TIMEOUT:
        return "pending"
        
    if external_status == "unsafe":
        return "unsafe"
    if all([dkim_check, spf_check, dmarc_check]):
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

            email_status = check_email_authentication(
                email_details['from_email'], 
                eml_content,
                email_details,
                msg_id
            )

            if (time.time() - start_time) > AI_RESPONSE_TIMEOUT:
                email_entry.status = "pending"
            else:
                email_entry.status = email_status
            email_entry.save()

            for url in email_details['urls']:
                URL.objects.create(email_detail=email_entry, url=url)

            for attachment_filename in email_details['attachments']:
                Attachment.objects.create(email_detail=email_entry, name=attachment_filename)

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
