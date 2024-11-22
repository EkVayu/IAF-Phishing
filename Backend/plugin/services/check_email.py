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

import os
import re
import requests
from requests.adapters import HTTPAdapter, Retry
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def check_external_apis(email_details, msg_id):
    status = "safe"

    def clean_email(email_str):
        email = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', email_str)
        return email.group(0) if email else ''

    from_email = clean_email(email_details['from_email'])
    to_email = clean_email(email_details['to_email'])

    # Retry logic setup
    session = requests.Session()
    retries = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))

    try:
        # 1. Content Check
        content_payload = {
            "msg_id": msg_id,
            "subject": email_details['subject'],
            "from_ids": [from_email],
            "to_ids": [to_email],
            "body": email_details['body']
        }

        logger.info(f"Sending content payload: {content_payload}")
        content_response = session.post(
            'https://anti-phishing.voxomos.ai/voxpd/process_content',
            json=content_payload,
            timeout=10  # Increased timeout for content check
        )
        content_data = content_response.json()
        logger.info(f"Content API Response: {content_data}")

        if content_data.get('status') == 200 and content_data.get('data', {}).get('result') == 'unsafe':
            return "unsafe"

        # 2. URL Check
        if email_details.get('urls'):
            for url in email_details['urls']:
                url_payload = {
                    "msg_id": msg_id,
                    "urls": [url]
                }

                logger.info(f"Sending URL payload: {url_payload}")
                url_response = session.post(
                    'https://anti-phishing.voxomos.ai/voxpd/process_url',
                    json=url_payload,
                    timeout=3 # Increased timeout for URL check
                )
                url_data = url_response.json()
                logger.info(f"URL API Response for {url}: {url_data}")

                if url_data.get('status') == 200 and url_data.get('data', {}).get('result') == 'unsafe':
                    return "unsafe"

        # 3. Attachment Check
        if email_details.get('attachments'):
            for attachment in email_details['attachments']:
                file_path = os.path.join(settings.MEDIA_ROOT, f'temp_attachments/{attachment}')
                if os.path.exists(file_path):
                    with open(file_path, 'rb') as f:
                        files = {'attachment': (attachment, f, 'application/octet-stream')}
                        attachment_payload = {'msg_id': msg_id}

                        logger.info(f"Sending attachment payload for: {attachment}")
                        attachment_response = session.post(
                            'https://anti-phishing.voxomos.ai/voxpd/process_attachment',
                            data=attachment_payload,
                            files=files,
                            timeout=3  # Increased timeout for attachment check
                        )
                        attachment_data = attachment_response.json()
                        logger.info(f"Attachment API Response for {attachment}: {attachment_data}")

                        if attachment_data.get('status') == 200 and attachment_data.get('data', {}).get('result') == 'unsafe':
                            return "unsafe"

        return status

    except requests.exceptions.Timeout:
        logger.warning(f"API timeout for msg_id: {msg_id}")
        return "pending"
    except requests.RequestException as e:
        logger.error(f"API request error: {e}")
        return "pending"
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return "pending"



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
