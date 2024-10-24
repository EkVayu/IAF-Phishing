from django.http import JsonResponse
from users.models import License, LicenseAllocation
import json

def verify_lid(data):
    try:
        license_id = data.get('licenseId')
        print(f"Received license ID: {license_id}")
        license = License.objects.get(hashed_license_id=license_id)
        print(f"License found: {license}")
        allocated_to = license.allocated_to
        print(f"Allocated to: {allocated_to}")
        
        # Check if license_id is provided
        if not license_id:
            return JsonResponse({
                "message": "License ID is missing",
                "STATUS": "Error",
                "Code": 0,
                "data": ""
            }, status=400)

        # Check if license exists
        try:
            license = License.objects.get(hashed_license_id=license_id)
            
            
            try:
                allocation = LicenseAllocation.objects.get(license=license)
                resp = {
                    "message": "License ID Found",
                    "STATUS": "Registered",
                    "Code": 1,
                    "data": {"email": allocation.allocated_to}
                }
            except LicenseAllocation.DoesNotExist:
                resp = {
                    "message": "License found but no email allocation",
                    "STATUS": "Registered",
                    "Code": 1,
                    "data": ""
                }
        except License.DoesNotExist:
            resp = {
                "message": "License not found",
                "STATUS": "Not Found",
                "Code": 0,
                "data": ""
            }

        return JsonResponse(resp)

    except Exception as e:
        return JsonResponse({
            "message": f"An error occurred: {str(e)}",
            "STATUS": "Error",
            "Code": 0,
            "data": ""
        }, status=500)