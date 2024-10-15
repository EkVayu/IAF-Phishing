from django.http import JsonResponse
from django.core.serializers import serialize
from plugin.models import *
import json

def spam_email(request):
    if request.method == 'POST':
        try:

            data = json.loads(request.body)
            email_id = data.get('emailId')
            plugin_id = data.get('pluginId') 
            
             # Not used in the query, but kept for future use
            
            if not email_id:
                return JsonResponse({
                    "message": "email_id is missing",
                    "STATUS": "Error",
                    "Code": 0,
                    "data": ""
                }, status=400)
            

            # Query using Django ORM
            spam_emails = EmailDetails.objects.filter(
                status__in=['Pending', 'Unsafe'],
                recievers_email=email_id
            ).order_by('-create_time')

            # Serialize the queryset to JSON
            serialized_data = serialize('json', spam_emails)
            
            # Parse the serialized data back to a Python object
            parsed_data = json.loads(serialized_data)

            # Extract the actual data from the serialized format
            result = [item['fields'] for item in parsed_data]

            return JsonResponse(result, safe=False)

        except json.JSONDecodeError:
            return JsonResponse({
                "message": "Invalid JSON format",
                "STATUS": "Error",
                "Code": 0,
                "data": ""
            }, status=400)

    return JsonResponse({
        "message": "Invalid request method",
        "STATUS": "Error",
        "Code": 0,
        "data": ""
    }, status=405)