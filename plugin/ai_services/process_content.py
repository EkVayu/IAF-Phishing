import json
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from plugin.models import EmailDetails

@csrf_exempt
@require_http_methods(["POST"])
def send_email_details(request):
    try:
        # Load JSON data from the request body
        data = json.loads(request.body)

        # Check if the incoming data is a dictionary
        if not isinstance(data, dict):
            return JsonResponse(
                {
                    "status": 400,
                    "message": "Invalid input format",
                    "data": {"result": None},
                    "errors": "Input must be a JSON object"
                },
                status=400
            )

        # Extracting the required fields from the JSON
        msg_id = data.get('msg_id')
        subject = data.get('subject')
        body = data.get('body')

        # Ensure both `to_ids` and `from_ids` are provided as lists
        to_ids = data.get('to_ids', [])
        from_ids = data.get('from_ids', [])

        # Convert to lists if they are strings
        if isinstance(to_ids, str):
            to_ids = [to_ids]
        if isinstance(from_ids, str):
            from_ids = [from_ids]

        if not msg_id:
            return JsonResponse(
                {
                    "status": 400,
                    "message": "msg_id is required",
                    "data": {"result": None},
                    "errors": "Missing msg_id"
                },
                status=400
            )
        
        # Retrieve the email details record
        try:
            email_details = EmailDetails.objects.get(msg_id=msg_id)
        except EmailDetails.DoesNotExist:
            return JsonResponse(
                {
                    "status": 404,
                    "message": "Email details not found",
                    "data": {"result": None},
                    "errors": f"No record found for msg_id: {msg_id}"
                },
                status=404
            )

        # Prepare the payload for the external API
        payload = {
            "msg_id": email_details.msg_id,
            "subject": subject or email_details.subject,
            "from_ids": from_ids or [email_details.senders_email],
            "to_ids": to_ids or [email_details.recievers_email],
            "body": body or email_details.body,
        }

        print(f"Sending payload: {payload}")

        # Send the POST request to the external API
        response = requests.post(
            'https://anti-phishing.voxomos.ai/voxpd/process_content',
            json=payload
        )
        # Check if the response is JSON and handle it
        try:
            response_data = response.json()
            print(f"Response data: {response_data}")  # Debugging line
        except ValueError:
            return JsonResponse(
                {
                    "status": response.status_code,
                    "message": "Response from external service is not valid JSON",
                    "data": {"result": None},
                    "errors": response.text  # Include the raw response text for debugging
                },
                status=response.status_code
            )

        # Ensure response_data is a dictionary before accessing it
        if isinstance(response_data, dict):
            if 'data' in response_data:
                result_status = response_data['data'].get('result', 'pending')
            else:
                return JsonResponse(
                    {
                        "status": 500,
                        "message": "Unexpected response format from external service",
                        "data": {"result": None},
                        "errors": "Response does not contain 'data'"
                    },
                    status=500
                )
        else:
            return JsonResponse(
                {
                    "status": 500,
                    "message": "Unexpected response format from external service",
                    "data": {"result": None},
                    "errors": f"Expected a JSON object, got {type(response_data).__name__}"
                },
                status=500
            )

        # Update the status in the database based on the response
        if result_status == 'safe':
            email_details.status = 'safe'
        elif result_status == 'unsafe':
            email_details.status = 'unsafe'
        else:
            email_details.status = 'pending'
        
        email_details.save()

        return JsonResponse(
            {
                "status": 200,
                "message": "Data sent successfully",
                "data": {
                    "result": result_status,
                    "id": email_details.id
                },
                "errors": ""
            },
            status=200
        )
    except json.JSONDecodeError:
        return JsonResponse(
            {
                "status": 400,
                "message": "Invalid JSON",
                "data": {"result": None},
                "errors": "Request body is not valid JSON"
            },
            status=400
        )
    except Exception as e:
        return JsonResponse(
            {
                "status": 500,
                "message": "An unexpected error occurred",
                "data": {"result": None},
                "errors": str(e)  # Include the exception message for debugging
            },
            status=500
        )