from django.http import JsonResponse
from users.models import License, LicenseAllocation
from django.utils import timezone
import json

def verify_lid(data):
    try:
        license_id = data.get('licenseId')
        print(f"Received license ID: {license_id}")
        if not license_id:
            return JsonResponse({
                "message": "License ID is missing",
                "STATUS": "Error",
                "Code": 0,
                "data": ""
            }, status=400)
        try:
            license = License.objects.get(hashed_license_id=license_id)
            print(f"License found: {license}")
            allocated_to = license.allocated_to
           
            if license.valid_from and license.valid_till:
                current_time = timezone.now()
                if license.valid_till < current_time:
                    return JsonResponse({
                        "message": "License has expired",
                        "STATUS": "Expired",
                        "Code": 0,
                        "data": ""
                    }, status=400)

                allocation = LicenseAllocation.objects.filter(license=license).order_by('-allocation_date').first()
                
                print(f"Allocation: {allocation}")
                if not allocation:
                    return JsonResponse({
                        "message": "License found but no email allocation",
                        "STATUS": "allocation not found",
                        "Code": 1,
                        "data": ""
                    }, status=400)

                if allocation and allocation.allocated_to == allocated_to:
                    print(f"Allocation: {allocation.allocated_to}")
                    return JsonResponse({
                        "message": "License ID Found and Valid",
                        "STATUS": "Registered",
                        "Code": 1,
                        "data": {"email": allocation.allocated_to}
                    }, status=200)
                    
                else:
                    return JsonResponse({
                        "message": "License allocation mismatch",
                        "STATUS": "Wrong Allocation",
                        "Code": 0,
                        "data": ""
                    }, status=400)
            else:
                return JsonResponse({
                    "message": "License validity dates not set",
                    "STATUS": "Invalid Dates",
                    "Code": 0,
                    "data": ""
                }, status=400)

        except License.DoesNotExist:
            return JsonResponse({
                "message": "License not found",
                "STATUS": "Not Found",
                "Code": 0,
                "data": ""
            }, status=404)
    except Exception as e:
        return JsonResponse({
            "message": f"An error occurred: {str(e)}",
            "STATUS": "Error",
            "Code": 0,
            "data": ""
        }, status=500)