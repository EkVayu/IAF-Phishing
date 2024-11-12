from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from users.models import *
from django.utils import timezone
import json

@csrf_exempt
def register(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        try:
            with transaction.atomic():
                license_id = data.get('licenseId')
                plugin_id = data.get('pluginId')
                ip_add = data.get('ipAddress')
                browser = data.get('browser')
                try:
                    license = License.objects.get(hashed_license_id=license_id)
                except License.DoesNotExist:
                    return JsonResponse({
                        "message": "License Not Exists",
                        "STATUS": "Not Found",
                        "Code": 0
                    }, status=400)
                plugin = PluginMaster.objects.create(
                    plugin_id=plugin_id,
                    license_id=license,
                    ip_add=ip_add,
                    browser=browser,
                    install_date=timezone.now()
                )
                plugin.save()
                
                return JsonResponse({
                    "message": "License Id registered",
                    "STATUS": "Registered",
                    "Code": 1
                }, status=200)

        except Exception as e:
            return JsonResponse({
                "error": str(e),
                "Code": 0
            }, status=500)

    return JsonResponse({
        "error": "Invalid request method",
        "Code": 0
    }, status=405)