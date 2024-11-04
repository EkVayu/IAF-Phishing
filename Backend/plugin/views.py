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
from users.models import PluginMaster, License
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
        data = json.loads(request.body)
        plugin_id = data.get('pluginId')
        ip_add = data.get('ipAddress')
        browser = data.get('browser')
        license_id = data.get('licenseId')
        
        plugin_install_uninstall = PluginInstallUninstall.objects.create(
                plugin_id=plugin_id,
                ip_address=ip_add,
                browser=browser,
                installed_at=timezone.now(),
                uninstalled_at=None
            )
        # plugin_install_uninstall.save()
        enable_disable_action = PluginEnableDisable.objects.create(
                plugin_install_uninstall=plugin_install_uninstall,
                enabled_at=timezone.now()
            )
        serializer = PluginEnableDisableSerializer(enable_disable_action)
    #         logger.info(f"Plugin {plugin_id} registered and enabled successfully")
    #         return JsonResponse(serializer.data, status=201, safe=False)
        response = verify_lid(data)
        return response
    # if request.method == 'POST':
    #     try:
    #         data = json.loads(request.body)
            
    #         plugin_id = data.get('pluginId')
    #         ip_add = data.get('ipAddress')
    #         browser = data.get('browser')
    #         license_id = data.get('licenseId')

    #         if not all([plugin_id, ip_add, license_id]):
    #             return JsonResponse({"error": "Plugin ID, IP Address, and License ID are required"}, status=400)

    #         logger.info(f"Registering plugin: {plugin_id}")
            
    #         response = register(request)

    #         if isinstance(response, JsonResponse):
    #             response_data = json.loads(response.content)
    #             if response_data.get('Code') == 0:
    #                 return response

    #         plugin_install_uninstall = PluginInstallUninstall.objects.create(
    #             plugin_id=plugin_id,
    #             ip_address=ip_add,
    #             browser=browser,
    #             installed_at=timezone.now(),
    #             uninstalled_at=None
    #         )
            
    #         enable_disable_action = PluginEnableDisable.objects.create(
    #             plugin_install_uninstall=plugin_install_uninstall,
    #             enabled_at=timezone.now()
    #         )
            
    #         serializer = PluginEnableDisableSerializer(enable_disable_action)
    #         logger.info(f"Plugin {plugin_id} registered and enabled successfully")
    #         return JsonResponse(serializer.data, status=201, safe=False)

    #     except json.JSONDecodeError:
    #         logger.error("Invalid JSON in request body")
    #         return JsonResponse({"error": "Invalid JSON in request body"}, status=400)
    #     except License.DoesNotExist:
    #         logger.error(f"License not found: {license_id}")
    #         return JsonResponse({"error": "License not found"}, status=404)
    #     except Exception as e:
    #         logger.error(f"Error in registration_view: {str(e)}", exc_info=True)
    #         return JsonResponse({"error": "Internal server error"}, status=500)
    
    # return JsonResponse({"error": "Invalid request method"}, status=405)


@csrf_exempt
def verify_license_id_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        response = verify_lid(data)
        return response
        
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


    @action(detail=False, methods=['get'], url_path='count')
    def get_dispute_count(self, request):
        email = request.query_params.get('email')
        msg_id = request.query_params.get('messageId')

        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not msg_id:
            return Response({"error": "Message Id is required"}, status=status.HTTP_400_BAD_REQUEST)

        
        active_dispute_count = Dispute.objects.filter(email=email, msg_id=msg_id).count()

        try:
            email_detail = EmailDetail.objects.get(message_id=msg_id)
        except EmailDetail.DoesNotExist:
            return Response({"error": "Message Id not found in email_details"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "dispute_count": active_dispute_count,
            "message_status": email_detail.status,
            "message_id": msg_id,
            "subject": email_detail.subject,
            "plugin_id": email_detail.plugin_id
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
        
    
        email_detail = EmailDetails.objects.filter(msg_id=msg_id).first()
    
        if not email_detail:
            return Response({"error": "Message Id not found in email_details"}, status=status.HTTP_404_NOT_FOUND)
        

        email_status = email_detail.status
        print(email_status)

    
        email_status_code = {
        'unsafe': 0,
        'safe': 1,  
        'Safe': 1,  
        
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

class GetDisputesView(viewsets.ViewSet):
    queryset = Dispute.objects.all()
    serializer_class = DisputeSerializer
    def list(self, request):
        try:
            disputes = Dispute.objects.all().order_by('-created_at')
            dispute_data = []
            for dispute in disputes:
                dispute_info = DisputeInfo.objects.filter(dispute=dispute).first()
                dispute_details = {
                    'dispute_id': dispute.id,
                    'email': dispute.email,
                    'msg_id': dispute.msg_id,
                    'counter': dispute.counter,
                    'status': dispute.status,
                    'created_at': dispute.created_at,
                    'user_comment': dispute_info.user_comment if dispute_info else None
                }
                dispute_data.append(dispute_details)
            return JsonResponse({
                    "message": "Disputes retrieved successfully",
                    "STATUS": "Success",
                    "Code": 1,
                    "data": dispute_data
                }, safe=False)
        except Exception as e:
            return JsonResponse({
                "message": str(e),
                "STATUS": "Error",
                "Code": 0,
                "data": ""
            }, status=500)
    

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

            print(f"Looking for emails with receiver: {email_id}")

            # Query using Django ORM
            spam_emails = EmailDetails.objects.filter(
                status__in=['unsafe','pending'],
                recievers_email=email_id
            ).order_by('-create_time')

            print(spam_emails)
            
            serialized_data = serialize('json', spam_emails)
            
            
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



@csrf_exempt
def graph_count(request):
    if request.method == 'GET':
        try:
            total_disputes = Dispute.objects.count()
            total_processed_emails = EmailDetails.objects.count()
            total_spam_emails = EmailDetails.objects.filter(status='unsafe').count()

            data = {
                'total_disputes': total_disputes,
                'total_processed_emails': total_processed_emails,
                'total_spam_emails': total_spam_emails,
            }
            print("count data",data)

            return JsonResponse({
                "message": "Counts retrieved successfully",
                "STATUS": "Success",
                "Code": 1,
                "data": data
            })

        except Exception as e:
            return JsonResponse({
                "message": str(e),
                "STATUS": "Error",
                "Code": 0,
                "data": ""
            }, status=500)

    return JsonResponse({
        "message": "Invalid request method",
        "STATUS": "Error",
        "Code": 0,
        "data": ""
    }, status=405)

