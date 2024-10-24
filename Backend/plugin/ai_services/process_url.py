import json
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from plugin.models import EmailDetails

@csrf_exempt
@require_http_methods(["POST"])
def process_url(request):
    try:
        # Parse the JSON data from the request body
        data = json.loads(request.body)
        msg_id = data.get('msg_id')
        url = data.get('url')

        # Validate that both msg_id and URL are provided
        if not msg_id or not url:
            return JsonResponse(
                {
                    "status": 400,
                    "message": "msg_id and url are required",
                    "data": [],
                    "errors": "Missing msg_id or url"
                },
                status=400
            )
        
        # Retrieve the EmailDetails record by msg_id
        email_details = EmailDetails.objects.get(msg_id=msg_id)
        
        # Prepare the payload for the external API
        payload = {
            "url": url,
            "msg_id": email_details.msg_id,
        }
        print(f"Sending payload: {payload}")
        
        # Send the POST request to the external anti-phishing service
        response = requests.post(
            'https://anti-phishing.voxomos.ai/voxpd/process_url',
            json=payload
        )

        # If the response is successful, process the result
        if response.status_code == 200:
            response_data = response.json()
            data_list = response_data.get('data', [])

            # Safely access the 'result' field from the response data
            if data_list and len(data_list) > 0:
                result_status = data_list[0].get('result', 'pending')
            else:
                result_status = 'pending'

            # Update the status in the EmailDetails record
            if result_status == 'safe':
                email_details.status = 'safe'
            elif result_status == 'unsafe':
                email_details.status = 'unsafe'
            else:
                email_details.status = 'pending'
            
            # Save the updated status to the database
            email_details.save()

            # Return a successful response
            return JsonResponse(
                {
                    "status": 200,
                    "message": "URL processed successfully",
                    "data": {
                        "result": result_status,
                        "url": url,
                        "msg_id": email_details.msg_id,
                        "id": email_details.id
                    },
                    "errors": ""
                },
                status=200
            )
        else:
            # If the external API response is not successful, return the error
            return JsonResponse(
                {
                    "status": response.status_code,
                    "message": "Failed to process the URL",
                    "data": [],
                    "errors": response.json()
                },
                status=response.status_code
            )
    except EmailDetails.DoesNotExist:
        # If the provided msg_id does not match any EmailDetails record, return a 404 response
        return JsonResponse(
            {
                "status": 404,
                "message": "Email details not found",
                "data": [],
                "errors": f"No record found for msg_id: {msg_id}"
            },
            status=404
        )
    except json.JSONDecodeError:
        # Handle JSON parsing errors
        return JsonResponse(
            {
                "status": 400,
                "message": "Invalid JSON data",
                "data": [],
                "errors": "The request body contains invalid JSON."
            },
            status=400
        )
    except requests.RequestException as e:
        # Handle any errors that occur during the API request
        return JsonResponse(
            {
                "status": 503,
                "message": "Failed to connect to the external service",
                "data": [],
                "errors": str(e)
            },
            status=503
        )
