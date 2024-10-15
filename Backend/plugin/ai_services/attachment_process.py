import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from plugin.models import EmailDetails
import requests
from django.core.files.storage import default_storage
from django.conf import settings



@csrf_exempt
@require_http_methods(["POST"])
def upload_attachment(request):
    msg_id = request.POST.get('msg_id')
    attachment = request.FILES.get('attachment')
    
    if not msg_id or not attachment:
        return JsonResponse({"error": "msg_id and attachment are required"}, status=400)

    try:
        # Use msg_id instead of message_id
        email_detail = EmailDetails.objects.get(msg_id=msg_id)
    except EmailDetails.DoesNotExist:
        return JsonResponse({"error": "No EmailDetails record found for the given msg_id"}, status=404)

    # Save the uploaded file temporarily
    file_path = default_storage.save(f'temp_attachments/{attachment.name}', attachment)
    full_file_path = os.path.join(settings.MEDIA_ROOT, file_path)

    try:
        url = 'https://anti-phishing.voxomos.ai/voxpd/process_attachment'

        data = {'msg_id': msg_id}
        files = {'attachments': open(full_file_path, 'rb')}

        # Send request to the external API
        response = requests.post(url, data=data, files=files)

        if response.status_code == 200:
            response_data = response.json()

            # Parse the status from the response data
            if 'data' in response_data and 'result' in response_data['data']:
                status = response_data['data']['result']  # Get status (safe/unsafe/pending)
                
                # Save the status in the email detail record
                email_detail.status = status
                email_detail.save()

                return JsonResponse({
                    "message": "Attachment sent to the AI successfully",
                    "details": response_data,
                    "database_record": {
                        "id": email_detail.id,
                        "msg_id": email_detail.msg_id,
                        "status": email_detail.status,
                    }
                })
            else:
                return JsonResponse({
                    "error": "Invalid response from the external API",
                    "details": response_data
                }, status=400)
        else:
            return JsonResponse({
                "error": "Failed to process the attachment",
                "details": response.text
            }, status=response.status_code)

    except requests.RequestException as e:
        return JsonResponse({
            "error": "Failed to connect to the external service",
            "details": str(e)
        }, status=503)

    finally:
        files['attachments'].close()
        default_storage.delete(file_path)