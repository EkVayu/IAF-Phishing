# backend/middleware/timezone_middleware.py
from django.utils import timezone
from pytz import timezone as pytz_timezone
import pytz

class TimezoneMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # If the response is JSON (i.e., API response)
        if hasattr(response, 'data') and isinstance(response.data, dict):
            self.convert_to_ist(response.data)

        return response

    def convert_to_ist(self, data):
        india_timezone = pytz_timezone('Asia/Kolkata')

        for key, value in data.items():
            # If the value is a datetime string in ISO format or similar
            if isinstance(value, str) and 'T' in value:
                try:
                    # Try to parse datetime string into a datetime object
                    dt_obj = timezone.parse_datetime(value)
                    if dt_obj:
                        # Convert to IST (Asia/Kolkata timezone) and format the output
                        ist_time = timezone.localtime(dt_obj).strftime('%Y-%m-%d %H:%M:%S')
                        data[key] = ist_time
                        print(f"Converted {key} to IST: {ist_time}")  # Debug print
                except Exception as e:
                    print(f"Error converting {key}: {e}")
