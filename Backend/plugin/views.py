
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from pathlib import Path
from .models import * 
import requests
from rest_framework.parsers import MultiPartParser
import json
from .view.register import register
from .view.verify_license_id  import verify_lid
from .services.check_email import check_email
# from .view.spam_email import spam_email
from users.models import PluginMaster, License
# from .view.dispute import dispute_count,dispute_email
from django.shortcuts import render
from django.contrib.auth.tokens import default_token_generator
from rest_framework import viewsets, permissions,generics,status,mixins
from rest_framework.decorators import action
from .serializers import * 
from plugin.models import * 
from rest_framework.response import Response 
from django.contrib.auth import get_user_model, authenticate
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.views.decorators.http import require_http_methods
from plugin.serializers import  *
from django.db import connection
import logging
from django.core.files.storage import default_storage
import os
from django.core.files.storage import default_storage
from django.core.serializers import serialize
logger = logging.getLogger(__name__)

from users.serializers import *



@csrf_exempt
def registration_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            plugin_id = data.get('pluginId')
            ip_add = data.get('ipAddress')
            browser = data.get('browser')
            license_id = data.get('licenseId')

            if not all([plugin_id, ip_add, license_id]):
                return JsonResponse({"error": "Plugin ID, IP Address, and License ID are required"}, status=400)

            logger.info(f"Registering plugin: {plugin_id}")
            
            
            response = register(request)

            if isinstance(response, JsonResponse):
                response_data = json.loads(response.content)
                if response_data.get('Code') == 0:
                    return response

            
            plugin_install_uninstall = PluginInstallUninstall.objects.create(
                plugin_id=plugin_id,
                ip_address=ip_add,
                browser=browser,
                installed_at=timezone.now(),
                uninstalled_at=None
            )
            
            enable_disable_action = PluginEnableDisable.objects.create(
                plugin_install_uninstall=plugin_install_uninstall,
                enabled_at=timezone.now()
            )
            
            serializer = PluginEnableDisableSerializer(enable_disable_action)
            logger.info(f"Plugin {plugin_id} registered and enabled successfully")
            return JsonResponse(serializer.data, status=201, safe=False)

        except json.JSONDecodeError:
            logger.error("Invalid JSON in request body")
            return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
        except License.DoesNotExist:
            logger.error(f"License not found: {license_id}")
            return JsonResponse({"error": "License not found"}, status=404)
        except Exception as e:
            logger.error(f"Error in registration_view: {str(e)}", exc_info=True)
            return JsonResponse({"error": "Internal server error"}, status=500)
    
    return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def verify_license_id_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        response = verify_lid(data)
        return response
    
# @csrf_exempt
# def handle_dispute_view(request):
#     if request.method == 'POST':
#         try:
#             reason = json.loads(request.body).get('reason')
#             print('Dispute Reason:', reason)
#             response = {'status': 'received', 'reason': reason}
#             return JsonResponse(response, status=200)
#         except Exception as e:
#             return JsonResponse({'error': str(e)}, status=500)
        
@csrf_exempt
def check_email_view(request):
    if request.method == 'POST':
        try:
            return check_email(request)
        except Exception as e:
            logger.error(f"Error in check_email_view: {e}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({"error": "Invalid request method"}, status=405)
        
@csrf_exempt
def spam_email_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            response = spam_email(data)
            return response
        except Exception as e:
            # return JsonResponse({'error': str(e)}, status=500)
            return str(e)
        
        
    return JsonResponse({"error": "Invalid request method"}, status=405)




class DisputeViewSet(viewsets.ViewSet):
    serializer_class = DisputeSerializer
    #permission_classes = [IsAuthenticated]


    @action(detail=False, methods=['get'], url_path='count/(?P<email>[^/]+)/(?P<msg_id>[^/]+)')
    # http://127.0.0.1:8000/plugin/disputes/count?email=user@example.com&messageId=112223344555666
    def get_dispute_count(self, request):
        """
        Returns the count of active disputes for the given email and message ID,
        along with the message status and other details from the email_details table.
        """
        email = request.query_params.get('email')
        message_id = request.query_params.get('messageId')
        
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not message_id:
            return Response({"error": "Message Id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Get the dispute count for the given email and message_id
        active_dispute_count = Dispute.objects.filter(email=email, msg_id=message_id).count()

        # Query the email_details table for the status and other details of the message_id
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT status, subject, plugin_id 
                FROM email_details 
                WHERE message_id = %s
            """, [message_id])
            row = cursor.fetchone()

        # Check if we got a result from email_details
        if row:
            message_status = row[0]  # Status of the email
            # plugin_id = row[2]       # Plugin ID related to the email
        else:
            return Response({"error": "Message Id not found in email_details"}, status=status.HTTP_404_NOT_FOUND)

        # Return the dispute count and the message status along with additional details
        return Response({
            "dispute_count": active_dispute_count,
            "message_status": message_status,
            "message_id":message_id
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='raise')
    def raise_dispute(self, request):
        email = request.data.get('email')
        msg_id = request.data.get('msgId')
        user_comment = request.data.get('userComment')
        print(email, msg_id, user_comment)

        if not email or not msg_id:
            return Response({"error": "Email and msg_id are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user_comment:
            return Response({"error": "User comment is required"}, status=status.HTTP_400_BAD_REQUEST)
        
    # Get the status from EmailDetails based on msg_id
        email_detail = EmailDetails.objects.filter(msg_id=msg_id).first()
    
        if not email_detail:
            return Response({"error": "Message Id not found in email_details"}, status=status.HTTP_404_NOT_FOUND)
        

        email_status = email_detail.status
        print(email_status)

    # Convert email status to code (0 = Unsafe, 1 = Safe)
        email_status_code = {
        'unsafe': 0,
        'safe': 1,  # Ensure the key is lowercase
        'Safe': 1,  # Keep this for case sensitivity
        # Add other statuses as needed
    }.get(email_status.lower())

        if email_status_code is None:
            return Response({"error": "Invalid email status in email_details"}, status=status.HTTP_400_BAD_REQUEST)
        
    # Check if the user has fewer than 3 active disputes
        active_dispute_count = Dispute.objects.filter(email=email).count()
    
        if active_dispute_count >= 3:
            return Response({"error": "You cannot raise more than 3 disputes"}, status=status.HTTP_403_FORBIDDEN)
        
    # Check if a dispute already exists for the given email and msg_id
        dispute, created = Dispute.objects.get_or_create(
        email=email,
        msg_id=msg_id,
        defaults={
            'counter': 1,
            'status': email_status_code,
            # 'created_by': request.email,  # Uncomment if you want to track created_by
            # 'updated_by': request.email,  # Uncomment if you want to track updated_by
        }
    )

    # If the dispute already exists, increment the counter
        if not created:
            dispute.counter += 1  # Increment the counter
            dispute.save()
        

    # Create the DisputeInfo entry
        dispute_info_data = {
        'dispute': dispute.id,
        'user_comment': user_comment,
        'counter': dispute.counter,  # Pass the updated counter value
        # 'created_by': request.user.id,  # Uncomment if you want to track created_by
        # 'updated_by': request.user.id,  # Uncomment if you want to track updated_by
    }

        dispute_info_serializer = DisputeInfoSerializer(data=dispute_info_data)
        if dispute_info_serializer.is_valid():

            dispute_info_serializer.save()
        else:
            return Response(dispute_info_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
        "message": "Dispute raised successfully",
        "dispute": DisputeSerializer(dispute).data,
        "email_status": email_status  # Include the status from email_details
       }, status=status.HTTP_201_CREATED)
    
        

class PluginInstallUninstallViewSet(viewsets.ViewSet):
    """
    A ViewSet for handling plugin installation and uninstallation actions.
    """

    @action(detail=False, methods=['post'], url_path='install')
    def install(self, request):
        # plugin id is send from frontend 
        # ip address is send from frontend 
        plugin_id = request.data.get('pluginId')
        ip_address = request.data.get('ipAddress')

        if not all([plugin_id, ip_address]):
            return Response({'error': 'All fields (plugin_id,  ip_address) are required'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if a plugin with the same plugin_id exists and is not uninstalled
        existing_plugin = PluginInstallUninstall.objects.filter(plugin_id=plugin_id, uninstalled_at__isnull=True).first()
    
        if existing_plugin:
            return Response({'error': 'The plugin is already installed and not yet uninstalled.'}, status=status.HTTP_400_BAD_REQUEST)

    # Create a new entry for plugin installation if no active installation exists
        plugin_action = PluginInstallUninstall.objects.create(
            plugin_id=plugin_id,
            ip_address=ip_address,
            installed_at=timezone.now()
    )

        return Response(PluginInstallUninstallSerializer(plugin_action).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='uninstall')
    def uninstall(self, request):
        plugin_id = request.data.get('pluginId')

        try:
        # Find the plugin action and update uninstalled_at
           plugin_action = PluginInstallUninstall.objects.get(plugin_id=plugin_id, uninstalled_at__isnull=True)
           plugin_action.uninstalled_at = timezone.now()
           plugin_action.save()

           return Response(PluginInstallUninstallSerializer(plugin_action).data, status=status.HTTP_200_OK)
        except PluginInstallUninstall.DoesNotExist:
           return Response({'error': 'Plugin not found or already uninstalled'}, status=status.HTTP_404_NOT_FOUND)
       
       

class PluginEnableDisableViewSet(viewsets.ViewSet):
    """
    A ViewSet for handling plugin enabling and disabling actions.
    """

    @action(detail=False, methods=['post'], url_path='enable')
    def enable(self, request):
        plugin_id = request.data.get('pluginId')

        try:
            # Get the most recent plugin action where the plugin is installed and not yet uninstalled
            plugin_action = PluginInstallUninstall.objects.filter(plugin_id=plugin_id, uninstalled_at__isnull=True).latest('installed_at')
            # Check if the plugin is already enabled
            if PluginEnableDisable.objects.filter(plugin_install_uninstall=plugin_action, enabled_at__isnull=False, disabled_at__isnull=True).exists():
                return Response({'error': 'The plugin is already enabled'}, status=status.HTTP_400_BAD_REQUEST)

            # Create a new entry for plugin enabling
            enable_disable_action = PluginEnableDisable.objects.create(
                plugin_install_uninstall=plugin_action,
                enabled_at=timezone.now()
            )

            return Response(PluginEnableDisableSerializer(enable_disable_action).data, status=status.HTTP_201_CREATED)
        
        except PluginInstallUninstall.DoesNotExist:
            return Response({'error': 'No active installation found for this plugin'}, status=status.HTTP_404_NOT_FOUND)
        
        
    @action(detail=False, methods=['post'], url_path='disable')
    def disable(self, request):
        plugin_id = request.data.get('pluginId')

        try:
        # Get the most recent plugin action where the plugin is installed and not yet uninstalled
            plugin_action = PluginInstallUninstall.objects.filter(plugin_id=plugin_id, uninstalled_at__isnull=True).latest('installed_at')

        # Check if the plugin is enabled (enabled_at is not null and disabled_at is null)
            enable_disable_action = PluginEnableDisable.objects.filter(
                plugin_install_uninstall=plugin_action, 
                enabled_at__isnull=False, 
                disabled_at__isnull=True
                ).first()

            if enable_disable_action:
            # If the plugin is currently enabled, update the `disabled_at` field to mark it as disabled
                enable_disable_action.disabled_at = timezone.now()
                enable_disable_action.save()

                return Response(PluginEnableDisableSerializer(enable_disable_action).data, status=status.HTTP_200_OK)
            else:
            # If the plugin is not enabled or already disabled, return an error
                return Response({'error': 'The plugin is either already disabled or was never enabled'}, status=status.HTTP_400_BAD_REQUEST)

        except PluginInstallUninstall.DoesNotExist:
            return Response({'error': 'No active installation found for this plugin'}, status=status.HTTP_404_NOT_FOUND)

   
   
class PluginRegistrationCheckViewSet(viewsets.ViewSet):
    """
    A ViewSet for handling plugin registration and license validation.
    """

    @action(detail=False, methods=['post'], url_path='check-registration')
    def check_registration(self, request):
        """
        Check if a plugin is registered and validates the associated license.
        """
        plugin_id = request.data.get('pluginId')

        if not plugin_id:
            return Response({'error': 'Plugin ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Step 1: Retrieve the plugin using plugin_id
            plugin = PluginMaster.objects.get(plugin_id=plugin_id)

            # Step 2: Check if the plugin has an associated license
            license = plugin.license_id

            # Step 3: Validate if the license is active and valid based on date
            now = timezone.now()
            if license.valid_from <= now <= license.valid_till:
                return Response({
                    'message': 'Plugin is registered and the license is valid.',
                    # 'plugin': PluginSerializer(plugin).data,
                    # 'license': LicenseSerializer(license).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'License has expired or is not yet valid.'
                }, status=status.HTTP_403_FORBIDDEN)
        
        except PluginMaster.DoesNotExist:
            return Response({
                'error': 'Plugin not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        except License.DoesNotExist:
            return Response({
                'error': 'License not found for this plugin.'
            }, status=status.HTTP_404_NOT_FOUND)
        


# class EmailUrlsViewSet(viewsets.ViewSet):
    
#     @action(detail=False, methods=['post'])
#     def transfer_urls_to_new_table(self, request):
#         """
#         Transfer URLs from EmailDetails to the new Urls table.
#         """
#         email_id = request.data.get('email_id')

#         if not email_id:
#             return Response(
#                 {"error": "email_id is required."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         try:
#             email_details = EmailDetails.objects.get(id=email_id)
#         except EmailDetails.DoesNotExist:
#             return Response(
#                 {"error": "EmailDetails not found."},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         # Assuming the URLs are stored in a field called 'urls' in EmailDetails
#         # and it's a TextField with URLs separated by commas
#         urls = email_details.urls.split(',') if email_details.urls else []

#         if not urls:
#             return Response(
#                 {"message": "No URLs found in the EmailDetails."},
#                 status=status.HTTP_200_OK
#             )

#         saved_urls = []
#         for url in urls:
#             url = url.strip()  # Remove any leading/trailing whitespace
#             if url:
#                 url_obj, created = urls.objects.get_or_create(
#                     url=url,
#                     email_id=email_details
#                 )
#                 if created:
#                     saved_urls.append(url)

#         return Response(
#             {
#                 "message": f"Successfully transferred {len(saved_urls)} URLs to the new table",
#                 "transferred_urls": saved_urls
#             },
#             status=status.HTTP_201_CREATED
#         )

# views.py


# @csrf_exempt
# @require_http_methods(["POST"])
# def upload_attachment(request):
#     msg_id = request.POST.get('msg_id')
#     attachment = request.FILES.get('attachment')

#     if not msg_id or not attachment:
#         return JsonResponse({"error": "msg_id and attachment are required"}, status=400)

#     try:
#         # Check if EmailDetails record exists
#         email_detail = EmailDetails.objects.get(message_id=msg_id)
#     except EmailDetails.DoesNotExist:
#         return JsonResponse({"error": "No EmailDetails record found for the given msg_id"}, status=404)

#     # Save the file temporarily
#     file_path = default_storage.save(f'temp_attachments/{attachment.name}', attachment)
#     full_file_path = os.path.join(settings.MEDIA_ROOT, file_path)

#     try:
#         # API endpoint
#         url = 'https://anti-phishing.voxomos.ai/voxpd/process_attachment'

#         # Prepare the data and file for the external API request
#         data = {'msg_id': msg_id}
#         files = {'attachments': open(full_file_path, 'rb')}

#         # Send the POST request to the external API
#         response = requests.post(url, data=data, files=files)

#         if response.status_code == 200:
#             response_data = response.json()
#             api_status = response_data['data']['result']

#             # Map API status to our model's status choices
#             status_mapping = {
#                 'safe': 'safe',
#                 'unsafe': 'unsafe',
#                 # Add any other mappings if needed
#             }
#             new_status = status_mapping.get(api_status.lower(), 'pending')

#             # Update the status in the existing EmailDetails record
#             email_detail.status = new_status
#             email_detail.save()

#             return JsonResponse({
#                 "message": "Attachment processed successfully",
#                 "details": response_data,
#                 "database_record": {
#                     "id": email_detail.id,
#                     "message_id": email_detail.message_id,
#                     "status": email_detail.status,
#                     "updated_at": email_detail.updated_at
#                 }
#             })
#         else:
#             return JsonResponse({
#                 "error": "Failed to process the attachment",
#                 "details": response.text
#             }, status=response.status_code)

#     except requests.RequestException as e:
#         return JsonResponse({
#             "error": "Failed to connect to the external service",
#             "details": str(e)
#         }, status=503)

#     finally:
#         # Close the file
#         files['attachments'].close()
#         # Remove the temporary file
#         default_storage.delete(file_path)

# @csrf_exempt  # Only use in development or if CSRF tokens are handled elsewhere
# def post_cdr_data(request):
#     if request.method == 'POST':
#         try:
#             # Parse JSON data from the request body
#             body_unicode = request.body.decode('utf-8')
#             body_data = json.loads(body_unicode)

#             # Extract required fields
#             msg_id = body_data.get('msg_id')
#             cdr_file = body_data.get['cdr_file']
#             status = body_data.get('status')

#             # Simple validation check (you can add more validation if needed)
#             if not msg_id or not cdr_file or not status:
#                 return JsonResponse({
#                     'status': 400,
#                     'message': 'Bad Request: Missing required fields.',
#                     'data': None,
#                     'errors': 'msg_id, cdr_file, and status are required.'
#                 }, status=400)

#             # Simulate processing the data (you can add custom logic here)
#             processed_data = {
#                 'msg_id': msg_id,
#                 'cdr_file': [cdr_file],
#                 'status': status
#             }

#             # Return success response
#             return JsonResponse({
#                 'status': 200,
#                 'message': 'Data processed successfully.',
#                 'msg_id': [msg_id],
#                 'errors': None
#             }, status=200)

#         except json.JSONDecodeError:
#             return JsonResponse({
#                 'status': 400,
#                 'message': 'Bad Request: Invalid JSON format.',
#                 'data': None,
#                 'errors': 'JSONDecodeError: Failed to parse JSON.'
#             }, status=400)

#     # Handle invalid HTTP method
#     return JsonResponse({
#         'status': 405,
#         'message': 'Method Not Allowed. Use POST.',
#         'data': None,
#         'errors': 'Invalid HTTP method'
#     }, status=405)



@csrf_exempt
@require_http_methods(["POST"])
def cdr_resposne_to_ai(request):
   
    if request.method != 'POST':
        return JsonResponse({"error": "Invalid request method"}, status=405)

    
    try:
       
        id = request.POST.get('id')
        msg_id = request.POST.get('msg_id')
        status = request.POST.get('status')
        cdr_file = request.FILES.get('cdr_file')  

        
        if not msg_id or not status:
            return JsonResponse({"error": "All fields (id, msg_id, status, cdr_file) are required"}, status=400)

        
        email_detail, created = EmailDetails.objects.update_or_create(
            id=id,
            defaults={
                'status': status,  
                'cdr_file': cdr_file,
            }
        )
        return JsonResponse({
            'status': 200,
            'message': 'Status Updated successfully.',
            'data':{'id': email_detail.id},
            'errors': None
        }, status=200)

    except Exception as e:
        return JsonResponse({"error": "An unexpected error occurred", "details": str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def url_response_to_ai(request):
    try:
        data = json.loads(request.body)
        id = data.get('id')
        msg_id = data.get('msg_id')
        status = data.get('status')
        url = data.get('url')

        if not id or not msg_id or not status or not url:
            return JsonResponse({"error": "All fields (id, msg_id, status, url) are required"}, status=400)
    

        email_detail, created = EmailDetails.objects.update_or_create(
            id=id,
            defaults={
                'status': status,
            }
        )
        return JsonResponse({
            'status': 200,
            'message': 'Status updated successfully.',
            'data': {'id': email_detail.id},
            'errors': None
        }, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        return JsonResponse({"error": "An unexpected error occurred", "details": str(e)}, status=500)
    

@csrf_exempt
@require_http_methods(["POST"])
def content_response_to_ai(request):
    try:
        
        data = json.loads(request.body)
        id = data.get('id')
        msg_id = data.get('msg_id')
        from_email = data.get('from_email')
        to_email = data.get('to_email')
        status = data.get('status')
        content = data.get('content')

       
        if not from_email or not msg_id or not status or not to_email:
            return JsonResponse({"error": "All fields ( msg_id, status,from_email,to_email ) are required"}, status=400)

        #
        email_detail, created = EmailDetails.objects.update_or_create(
            id=id,
            defaults={
                'status': status,
            }
        )
        return JsonResponse({
            'status': 200,
            'message': 'Status updated successfully.',
            'data': {'id': email_detail.id},
            'errors': None
        }, status=200)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)

    except Exception as e:
        return JsonResponse({"error": "An unexpected error occurred", "details": str(e)}, status=500)
    

class BrowserDetailsViewSet(viewsets.ModelViewSet):
    queryset = LicenseAllocation.objects.all()
    serializer_class = LicenseAllocationSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        data = {
            'license_validity': instance.license_validity,
            'license_allocated_to': instance.license_allocated_to,
            'allocated_date': instance.allocated_date,
        }
        print(
            f"License Validity: {instance.license_validity}",
            f"License Allocated To: {instance.license_allocated_to}",
            f"Allocated Date: {instance.allocated_date}",
        )

        return Response(data)
    

@csrf_exempt
def spam_email(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email_id = data.get('emailId')
            plugin_id = data.get('pluginId') 
            
            if not email_id:
                return JsonResponse({
                    "message": "email_id is missing",
                    "STATUS": "Error",
                    "Code": 0,
                    "data": ""
                }, status=400)

            print(f"Looking for emails with receiver: {email_id}")  # Debugging line

            # Query using Django ORM
            spam_emails = EmailDetails.objects.filter(
                status__in=['unsafe','pending'],  # Ensure these match exactly what's in the database
                recievers_email=email_id
            ).order_by('-create_time')

            print(spam_emails)  # Debugging line to see the queryset

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