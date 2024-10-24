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

                # Check if license exists and is not in use
                try:
                    license = License.objects.get(hashed_license_id=license_id)
                except License.DoesNotExist:
                    return JsonResponse({"message": "License Not Exists", "STATUS": "Not Found", "Code": 0})

                if license.status == '1':
                    return JsonResponse({"message": "License Already In Use", "STATUS": "", "Code": 0})

                # Check if plugin_id already exists
                if PluginMaster.objects.filter(plugin_id=plugin_id).exists():
                    return JsonResponse({"message": "Plugin Id already registered, Install again", "STATUS": "", "Code": 0})
                # Create new plugin
                plugin = PluginMaster.objects.create(
                    plugin_id=plugin_id,
                    license=license,
                    ip_add=ip_add,
                    browser=browser
                )
                # Update license
                license.plugin = plugin
                license.status = '1'
                license.save()
                return JsonResponse({"message": "License Id registered", "STATUS": "Registered", "Code": 1})
        except Exception as e:
            return JsonResponse({"error": str(e), "Code": 0})
    return JsonResponse({"error": "Invalid request method", "Code": 0})