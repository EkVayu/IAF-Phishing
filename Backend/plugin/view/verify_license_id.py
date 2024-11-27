from django.http import JsonResponse
from django.utils import timezone
from users.models import License, LicenseAllocation


def verify_lid(data):
    try:
        # Extract required fields from the input data
        license_id = data.get('licenseId')
        

        # Validate mandatory fields
        if not license_id:
            return JsonResponse({
                "message": "Missing required fields (licenseId)",
                "STATUS": "Error",
                "Code": 0
            }, status=400)

        # Fetch license
        try:
            license = License.objects.get(hashed_license_id = license_id)
        except License.DoesNotExist:
            return JsonResponse({
                "message": "License not found",
                "STATUS": "Not Found",
                "Code": 0
            }, status=404)
        if license.hashed_license_id != license_id:
            return JsonResponse({
                "message": "License id not matched",
                "STATUS": "Found",
                "Code": 1
            }, status=200)
        # Check license validity dates
        if not license.valid_from or not license.valid_till:
            return JsonResponse({
                "message": "License validity dates not set. Please contact the administrator.",
                "STATUS": "Invalid Dates",
                "Code": 0
            }, status=400)

        # Check if the license has expired
        current_time = timezone.now()
        if license.valid_till < current_time:
            return JsonResponse({
                "message": "License has expired. Please contact the administrator.",
                "STATUS": "Expired",
                "Code": 0
            }, status=400)

        # Fetch the latest license allocation
        allocation = LicenseAllocation.objects.filter(license=license).order_by('-allocation_date').first()
        if not allocation:
            return JsonResponse({
                "message": "License found but no email allocation. Please contact the administrator.",
                "STATUS": "Allocation Not Found",
                "Code": 0
            }, status=400)

        allocated_to = allocation.allocated_to
        if allocation.allocated_to != license.allocated_to:
            return JsonResponse({
                "message": "License allocation mismatch. Please contact the administrator.",
                "STATUS": "Wrong Allocation",
                "Code": 0
            }, status=400)       

        return JsonResponse({
            "message": "License verified successfully.",
            "STATUS": "Success",
            "Code": 1,
            "data": {"email": allocated_to}
        }, status=200)

    except Exception as e:
        return JsonResponse({
            "message": f"An error occurred: {str(e)}",
            "STATUS": "Error",
            "Code": 0
        }, status=500)
