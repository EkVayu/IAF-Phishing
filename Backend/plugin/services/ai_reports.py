import json
from django.utils.timezone import now
from plugin.models import EmailDetails, Content, URL, Attachment
def generate_email_report(file_path='email_reports.json'):
    email_reports = []

    # Fetch all EmailDetails records
    email_details_list = EmailDetails.objects.all()

    for email_detail in email_details_list:
        report = {
            "msg_id": email_detail.msg_id,
            "subject": email_detail.subject,
            "from_email": email_detail.from_email,
            "to_email": email_detail.to_email.split(",") if email_detail.to_email else [],
            "body": email_detail.body,
            "content": {},
            "urls": [],
            "attachments": []
        }
        # Get Content analysis data
        content = Content.objects.filter(email_detail=email_detail).first()
        if content:
            report["content"] = {
                "ai_remarks": content.ai_Remarks or "No remarks",
                "ai_sended_at": content.ai_sended_at.strftime('%Y-%m-%dT%H:%M:%S') if content.ai_sended_at else None
            }

        # Get URL analysis data
        urls = URL.objects.filter(email_detail=email_detail)
        for url in urls:
            report["urls"].append({
                "url": url.url,
                "ai_remarks": url.ai_Remarks or "No remarks",
                "ai_sended_at": url.ai_sended_at.strftime('%Y-%m-%dT%H:%M:%S') if url.ai_sended_at else None
            })

        # Get Attachment analysis data
        attachments = Attachment.objects.filter(email_detail=email_detail)
        for attachment in attachments:
            report["attachments"].append({
                "filename": attachment.attachment.name,
                "ai_remarks": attachment.ai_Remarks or "No remarks",
                "ai_sended_at": attachment.ai_sended_at.strftime('%Y-%m-%dT%H:%M:%S') if attachment.ai_sended_at else None
            })

        email_reports.append(report)

    # Save to a JSON file
    with open(file_path, 'w') as json_file:
        json.dump({"email_reports": email_reports}, json_file, indent=4)

    return file_path
