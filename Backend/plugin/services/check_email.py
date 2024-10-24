import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django.conf import settings
from pathlib import Path
import email
from email import policy
import re
from plugin.models import EmailDetails, Attachment, URL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
import os
FILE_PATH = Path(settings.EMAIL_BACKUP_DIR)
FILE_PATH_S = Path(settings.EMAIL_FILE_DIR)

@csrf_exempt
@transaction.atomic
def check_email(request):
    try:
        logger.info("Processing check_email request")

        msg_id = request.POST.get('messageId')
        plugin_id = request.POST.get('pluginId')
        browser = request.POST.get('browser')
        ipv4 = request.POST.get('ipv4')
        uploaded_file = request.FILES.get('file')

        if not msg_id:
            logger.warning("No messageId provided")
            return JsonResponse({"message": "Please provide message Id", "STATUS": "Not Found", "Code": 0})

        logger.info(f"Received messageId: {msg_id}")

        existing_email = EmailDetails.objects.filter(msg_id=msg_id).first()
        if existing_email:
            logger.info(f"Email with messageId {msg_id} already exists")
            return JsonResponse({"message": "Email already exists", "STATUS": "Found", "Code": 1,"email_status": existing_email.status})

        newpath_set = FILE_PATH / msg_id
        logger.info(f"Creating directory at {newpath_set}")
        os.makedirs(newpath_set, exist_ok=True)

        if uploaded_file:
            logger.info("File uploaded successfully")
            eml_content = uploaded_file.read()
            eml_filename = f"{msg_id}.eml"

            backup_saved_file_path = newpath_set / eml_filename
            logger.info(f"Saving file to {backup_saved_file_path}")
            
            # Ensure the parent directory exists
            os.makedirs(os.path.dirname(backup_saved_file_path), exist_ok=True)
            
            with open(backup_saved_file_path, 'wb') as backup_file:
                backup_file.write(eml_content)

            logger.info("Extracting email details")
            email_details = check_eml(eml_content, newpath_set)
            if not email_details:
                logger.error("Failed to extract email details")
                return JsonResponse({"error": "Failed to extract email details"}, status=400)

            logger.info(f"Extracted email details: {email_details}")

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
                urls=', '.join(email_details['urls']),
                attachments=email_details['attachments'],
            )
            email_entry.save()

            # Save URLs to the URL table
            created_urls = []
            for url in email_details['urls']:
                url_obj = URL.objects.create(email_detail=email_entry, url=url)
                created_urls.append(url_obj.url)

            logger.info(f"Email details saved to database: {email_entry}")

            # Create a response dictionary
            response_data = {
                "message": "Email processed successfully",
                "STATUS": "Success",
                "Code": 1,
                "email_status": getattr(email_entry, 'status', 'unknown'),
                "created_urls": created_urls,
                "messageId": msg_id,
            }
            return JsonResponse(response_data, status=200)

        logger.warning("No file received")
        return JsonResponse({"error": "No file received"}, status=400)

    except Exception as e:
        logger.error(f"Error in check_email: {e}", exc_info=True)
        return JsonResponse({"error": f"Internal Server Error: {str(e)}"}, status=500)


def check_eml(eml_content, newpath_set):
    try:
        msg = email.message_from_bytes(eml_content, policy=policy.default)

        to_email = msg.get('To', '')
        from_email = msg.get('From', '')
        cc = msg.get('Cc', '')
        bcc = msg.get('Bcc', '')
        subject = msg.get('Subject', '')
        
        body = extract_body(msg)
        urls = extract_urls(eml_content)
        domains = extract_domains(eml_content)
        
        attachment_info = extract_attachments(msg, newpath_set)

        logger.info(f"To: {to_email}")
        logger.info(f"From: {from_email}")
        logger.info(f"CC: {cc}")
        logger.info(f"BCC: {bcc}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Body: {body[:100]}...")
        logger.info(f"URLs: {urls}")
        logger.info(f"Domains: {domains}")
        logger.info(f"Attachments: {attachment_info}")

        return {
            'to_email': to_email,
            'from_email': from_email,
            'cc': cc,
            'bcc': bcc,
            'subject': subject,
            'body': body,
            'urls': urls,
            'attachments': attachment_info.get('attachments', [])
        }
    except Exception as e:
        logger.error(f"Error extracting email details: {e}")
        return None

def extract_body(msg):
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                body += part.get_payload(decode=True).decode(errors='ignore')
    else:
        body = msg.get_payload(decode=True).decode(errors='ignore')
    return body

def extract_attachments(msg, destination_path):
    try:
        info = {"attachments": []}

        for part in msg.iter_attachments():
            filename = part.get_filename()
            if not filename:
                filename = f"attachment_{len(info['attachments']) + 1}.bin"

            file_path = Path(destination_path) / filename
            
            # Ensure the parent directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            with file_path.open('wb') as attachment_file:
                attachment_file.write(part.get_payload(decode=True))
            logger.info(f"Attachment saved: {file_path}")

            attachment_info = {"filename": filename}
            info["attachments"].append(attachment_info)

        return info
    except Exception as e:
        logger.error(f"Error extracting attachments: {e}")
        return {"attachments": []}

def extract_urls(eml_content):
    url_pattern = re.compile(rb'https?://\S+')
    return [url.decode('utf-8', errors='ignore') for url in url_pattern.findall(eml_content)]


def extract_domains(eml_content):
    domain_pattern = re.compile(rb'(?<=@)\S+')
    return [domain.decode('utf-8', errors='ignore') for domain in domain_pattern.findall(eml_content)]