from django.http import JsonResponse
from django.utils import timezone
from django.db import transaction
from users.models import License, LicenseAllocation
from plugin.models import UserSystemDetails, SystemBrowserDetails


def verify_lid(data):
    try:
        # Extract required fields from the input data
        license_id = data.get('licenseId')
        uuid = data.get('uuid')
        mac_address = data.get('macAddress')
        browser = data.get('browser')

        # Validate mandatory fields
        if not license_id or not uuid or not mac_address or not browser:
            return JsonResponse({
                "message": "Missing required fields (licenseId, uuid, macAddress, browser)",
                "STATUS": "Error",
                "Code": 0
            }, status=400)

        # Fetch license
        try:
            license = License.objects.get(hashed_license_id=license_id)
        except License.DoesNotExist:
            return JsonResponse({
                "message": "License not found",
                "STATUS": "Not Found",
                "Code": 0
            }, status=404)

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

        # Check if the mac_address and uuid are already registered
        existing_system = UserSystemDetails.objects.filter(license_allocation=allocation, uuid=uuid).first()
        if existing_system:
            # If the mac_address matches, proceed
            if existing_system.mac_address == mac_address:
                # Check if the browser is already registered
                if SystemBrowserDetails.objects.filter(device_information=existing_system, browser=browser).exists():
                    return JsonResponse({
                        "message": "This device with browser are already registered.",
                        "STATUS": "Already Registered",
                        "Code": 0
                    }, status=400)
                else:
                    # Allow new browser registration for the same device
                    SystemBrowserDetails.objects.create(
                        device_information=existing_system,
                        ipv4=data.get('ipAddress'),
                        browser=browser
                    )
                    return JsonResponse({
                        "message": "New browser registered successfully.",
                        "STATUS": "Browser Registered",
                        "Code": 1,
                        "data": {"email": allocated_to}
                    }, status=200)
            else:
                # mac_address mismatch
                return JsonResponse({
                    "message": "License is already registered on another device.",
                    "STATUS": "Device Mismatch",
                    "Code": 0
                }, status=400)

        # If no existing record, create new system details and browser registration
        with transaction.atomic():
            user_system_details, created = UserSystemDetails.objects.update_or_create(
            uuid=uuid,
        defaults={
        "license_allocation": allocation,
        "mac_address": mac_address,
        "serial_number": data.get('serialNumber'),
        "os_type": data.get('osType'),
        "os_platform": data.get('osPlatform'),
        "os_release": data.get('osRelease'),
        "host_name": data.get('hostName'),
        "architecture": data.get('architecture'),
    }
)
            # Register the browser details
            SystemBrowserDetails.objects.create(
                device_information=user_system_details,
                ipv4=data.get('ipAddress'),
                browser=browser
            )

        return JsonResponse({
            "message": "License and browser details registered successfully.",
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
