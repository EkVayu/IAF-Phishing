from django.shortcuts import render
from django.contrib.auth.tokens import default_token_generator
from rest_framework import viewsets, permissions, generics, status, mixins
from rest_framework.decorators import action
from .serializers import *
from .models import *
from rest_framework.response import Response
from django.contrib.auth import get_user_model, authenticate
from knox.models import AuthToken
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.shortcuts import get_object_or_404
from plugin.models import EmailDetails, DisputeInfo, PluginEnableDisable, Dispute, Attachment
# from plugin.serializers import EmailDetailsSerializer
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from drf_yasg.utils import swagger_auto_schema
from datetime import datetime
from django.utils import timezone
from datetime import timedelta
from .models import RoughURL, RoughDomain, RoughMail
from rest_framework.exceptions import ValidationError
from .serializers import RoughURLSerializer, RoughDomainSerializer, RoughMailSerializer, DisputeUpdateSerializer, AttachmentSerializer

from rest_framework.authentication import SessionAuthentication, BasicAuthentication
import json
from django.core.files.storage import default_storage
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes
from rest_framework.views import APIView
import traceback

User = get_user_model()
class LoginViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    @swagger_auto_schema(request_body=LoginSerializer)
    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
                
            user = authenticate(request, email=email, password=password,)

            if user:
                if user.is_superuser:
                    role = "superuser"
                elif user.is_staff:
                    role = "staff"
                else:
                    role = "user"
                request.session['user_role'] = role
                request.session['user_email'] = user.email
                request.session['user_username'] = user.username
                
                _, token = AuthToken.objects.create(user)

                return Response(
                    {
                        "user": self.serializer_class(user).data,
                        "token": token,
                        "role": role,
                        "message": f"Logged in as {role.capitalize()}"
                    },
                    status=200
                )
            else:
                return Response({"error": "Invalid credentials"}, status=401)
        else:
            return Response(serializer.errors, status=400)
         

class RegisterViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            return Response(serializer.errors, status=400)


#nidhi
class UserViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def list(self, request):
        # Fetch only non-deleted users
        queryset = User.objects.filter(is_deleted=False,is_staff=True,is_superuser=False)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)

    @action(detail=True, methods=['delete'], url_path='soft-delete')
    def soft_delete(self, request, pk=None):
        """Perform soft delete on a user."""
        user = get_object_or_404(User, pk=pk, is_deleted=False)
        user.delete()  # This will trigger the soft delete
        return Response({"detail": "User soft deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        """Restore a soft-deleted user."""
        user = get_object_or_404(User, pk=pk, is_deleted=True)
        user.restore()  # This will restore the user
        return Response({"detail": "User restored successfully."}, status=status.HTTP_200_OK)
    
    

class StaffViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    def list(self, request):
        queryset = User.objects.filter(is_staff=True,is_superuser=False)
        count = queryset.count()
        serializer = self.serializer_class(queryset, many=True)
        return Response({
            'count': count,
            'results': serializer.data
        })
    



# Changes password
class ChangePasswordViewset(viewsets.ViewSet):
    # permission_classes = [IsAuthenticated]
    permission_classes = [permissions.AllowAny]

    serializer_class = ChangePasswordSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        # Check user is valid or not,  if valid then password will changed
        if serializer.is_valid():
            user = request.user
            old_password = serializer.validated_data.get('old_password')
            new_password = serializer.validated_data.get('new_password')
            # check password will not match to the old password then show error
            if not user.check_password(old_password):
                return Response({'old_password': 'Wrong password'}, status=status.HTTP_401_BAD_REQUEST)
            # if everything is good then password will saved
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password changed successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Password reset request
class PasswordResetRequestViewset(mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = CustomUser.objects.get(email=email)
            except CustomUser.DoesNotExist:
                return Response({'email': 'User with this email does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_url = f"{request.build_absolute_uri('/reset-password/')}?uid={uid}&token={token}"

            message = f"Verification Link sent Successfully on your registered email: {reset_url}"
            # Mehtab
            send_mail(
                'Password Reset Request',
                message,
                'no-reply@yourdomain.com',
                [user.email],
                fail_silently=False,
            )

            return Response({'message': 'Password reset email sent.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
# Password reset
class PasswordResetViewset(mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = PasswordResetSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            uid = serializer.validated_data['uid']
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            try:
                uid = urlsafe_base64_decode(uid).decode()
                user = User.objects.get(pk=uid)
            except (User.DoesNotExist, ValueError, TypeError):
                return Response({'uid': 'Invalid UID.'}, status=status.HTTP_400_BAD_REQUEST)

            if not default_token_generator.check_token(user, token):
                return Response({'token': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_password)
            user.save()

            return Response({'message': 'Password reset successful.'}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# License view
class LicenseListView(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]

    queryset = License.objects.all()
    serializer_class = LicenseSerializer
    # Nidhi
    def list(self, request): 
        current_user = request.user    

        # Check if the user is authenticated
        if not current_user.is_authenticated:
            return Response({'error': 'Login required to access licenses.'}, status=status.HTTP_401_UNAUTHORIZED)
 
        user_email = current_user.email 
        print(user_email)
        try:
           user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        print(user)
        user_is_active = user.is_active
        print(user_is_active)

        user_is_staff=user.is_staff
        print(user_is_staff)

        user_is_superuser=user.is_superuser
        print(user_is_superuser)

        if user_is_superuser:
           queryset = License.objects.all() 
        else:
           queryset = License.objects.filter(is_reserved=0)  
        print(queryset)
        serializer = self.serializer_class(queryset, many=True)
        count = queryset.count()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def allocate(self, request, pk=None):
        try:
            # Get the License object using the provided primary key (pk)
            license = self.get_object()
            allocated_to = request.data.get('allocated_to')
            
            if not allocated_to:
                return Response({'error': 'allocated_to is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Set allocation date as the current time
            allocation_date = timezone.now()

            # Update the License instance
            license.allocated_to = allocated_to
            license.status = 1  # Assuming status "1" means allocated
            license.save()

            # Create a new LicenseAllocation instance
            LicenseAllocation.objects.create(
                license=license,
                allocated_to=allocated_to,
                allocation_date=allocation_date
            )

            # Prepare the HTML email message
            html_message = f"""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>License Allocation</title>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                    }}
                    .container {{
                        background-color: #f8f8f8;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    }}
                    .header {{
                        text-align: center;
                        margin-bottom: 20px;
                    }}
                    .content {{
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 6px;
                        box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
                    }}
                    .content p {{
                        margin: 10px 0;
                    }}
                    .footer {{
                        margin-top: 20px;
                        text-align: center;
                        color: #aaa;
                        font-size: 12px;
                    }}
                    .highlight {{
                        color: #0044cc;
                        font-weight: bold;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>License Allocation </h2>
                    </div>
                    <div class="content">
                        <p><strong>Dear User,</strong></p>
                        <p>Your license has been successfully allocated. Below are the details:</p>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Allocated to :</td>
                                <td style="padding: 8px; border: 1px solid #ddd;" class="highlight">{allocated_to}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Allocation Date:</td>
                                <td style="padding: 8px; border: 1px solid #ddd;" class="highlight">{allocation_date}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">License ID:</td>
                                <td style="padding: 8px; border: 1px solid #ddd;" class="highlight">{license.hashed_license_id}</td>
                            </tr>
                        </table>
                        <p>If you have any questions, feel free to reach out to us. support@ekvayu.com</p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2024 Ekvayu Tech Pvt Ltd. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            send_mail(
                'License Allocation',
                '',
                'no-reply@yourdomain.com',
                [allocated_to],
                fail_silently=False,
                html_message=html_message
            )

            # Return success response
            return Response({'status': 'License allocated successfully'}, status=status.HTTP_200_OK)
        
        except Exception as e:
            # Return error if something goes wrong
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    

    # Revoke
    # licesnses/revoke-license/
    @action(detail=False, methods=['post'], url_path='revoke-license/(?P<license_id>[^/.]+)')
    def revoke_license(self, request, license_id=None):
        try:
            license = License.objects.get(license_id=license_id)
            license.status = '0'
            license.allocated_to = None
            license.plugin_id = None
            license.save()

            license_allocation = LicenseAllocation.objects.filter(license=license).order_by('-allocation_date').first()
            if license_allocation:
                license_allocation.revoke_date = timezone.now()
                license_allocation.save()

            return Response({"detail": "License revoked successfully"}, status=status.HTTP_200_OK)
        except License.DoesNotExist:
            return Response({"detail": "License not found"}, status=status.HTTP_404_NOT_FOUND)


    @action(detail=False, methods=['patch'], url_path='update-by-license-id/(?P<license_id>[^/.]+)')
    def update_by_license_id(self, request, license_id=None):

        try:
            license_instance = License.objects.get(license_id=license_id)
        except License.DoesNotExist:
            return Response({"detail": "License not found"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'allocated_to' in data:
            license_instance.allocated_to = ""
            license_instance.status = 0
        # if 'status' in data:
        #     license_instance.status = data['status']
        license_instance.save()
        serializer = LicenseSerializer(license_instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # create multiple license view 
    @action(detail=False, methods=['POST'], url_path='create-multiple-license')
    def create_multiple_license_id(self, request):
        number_of_licenses = request.data.get('number_of_licenses')
        organisation = request.data.get('organisation')
        valid_from_str = request.data.get('valid_from')
        valid_till_str = request.data.get('valid_till')

        try:
            number_of_licenses = int(number_of_licenses)
        except (ValueError, TypeError):
            return Response({"error": "Invalid 'number_of_licenses'. It must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            valid_from = datetime.strptime(valid_from_str, '%Y-%m-%d %H:%M:%S') if valid_from_str else None
            valid_till = datetime.strptime(valid_till_str, '%Y-%m-%d %H:%M:%S') if valid_till_str else None
        except ValueError:
            return Response({"error": "Invalid date format. Use 'YYYY-MM-DD HH:MM:SS' format."}, status=status.HTTP_400_BAD_REQUEST)

        valid_from = timezone.make_aware(valid_from) if valid_from else timezone.now()
        valid_till = timezone.make_aware(valid_till) if valid_till else timezone.now()

        
        last_license = License.objects.filter(license_id__startswith="LIC-").order_by('-license_id').first()
        base_license_number = int(last_license.license_id.split('-')[1]) + 1 if last_license else 1

        licenses_to_create = []

        
        for i in range(number_of_licenses):
            serial_number = base_license_number + i
            license_id = f"LIC-{serial_number:04d}"

            license = License(
                license_id=license_id,
                organisation=organisation,
                valid_from=valid_from,
                valid_till=valid_till,
                created_timestamp=timezone.now()
            )
            licenses_to_create.append(license)

        if licenses_to_create:
            
            License.objects.bulk_create(licenses_to_create)
            return Response({"message": f"{number_of_licenses} license IDs created successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "No licenses were created."}, status=status.HTTP_400_BAD_REQUEST)
        
#nidhi
class LicenseViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = LicenseSerializer

    @swagger_auto_schema(
        operation_summary="Reserve or unreserve a license",
        responses={
            200: LicenseAllocationSerializer,
            400: "License is already active.",
            403: "You do not have permission to perform this action.",
            404: "License not found."
        }
    )
    def reserve_license(self, request, pk=None):
        """
        Reserve or unreserve a license based on the action specified.
        Only superusers can perform this action.
        """
        user = request.user

        # Check if the user is a superuser
        if not user.is_superuser:
            return Response({"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action')

        try:
            # Fetch the license instance
            license_instance = License.objects.get(license_id=pk)

            if action == '1':  # Action to reserve the license
                # Check if the license is already active or reserved
                if license_instance.status == '1':
                    return Response({"message": "License is already activated. Please revoke it before inactivating."}, status=status.HTTP_200_OK)

                if license_instance.is_reserved:
                    return Response({"message": "License is already reserved."}, status=status.HTTP_200_OK)

                # Reserve the license
                license_instance.is_reserved = True
                license_instance.save()
                message = "License has been reserved."

            elif action == '0':  # Action to unreserve the license
                if not license_instance.is_reserved:
                    return Response({"message": "License is not currently reserved."}, status=status.HTTP_400_BAD_REQUEST)

                # Unreserve the license
                license_instance.is_reserved = False
                license_instance.save()
                message = "License has been unreserved."

            else:
                return Response({"message": "Invalid action specified. Use '1' to reserve or '0' to unreserve."}, status=status.HTTP_400_BAD_REQUEST)

            # Return the updated license information
            serializer = self.serializer_class(license_instance)
            return Response({'license': serializer.data, 'message': message}, status=status.HTTP_200_OK)

        except License.DoesNotExist:
            return Response({"detail": "License not found."}, status=status.HTTP_404_NOT_FOUND)
    


class PluginMasterViewSet(viewsets.ModelViewSet):
    # permission_classes = [permissions.IsAuthenticated]
    permission_classes = [permissions.AllowAny]

    queryset = PluginMaster.objects.all()
    serializer_class = PluginMasterSerializer

    def list(self, request):
        queryset = PluginMaster.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='by-license/(?P<license_id>[^/.]+)')
    def get_by_license_id(self, request, license_id=None):
        plugins = PluginMaster.objects.filter(license_id__license_id=license_id)
        if plugins.exists():
            serializer = self.get_serializer(plugins, many=True)
            return Response(serializer.data)
        else:
            return Response({"detail": "No plugins found for the provided license_id"},
                            status=status.HTTP_404_NOT_FOUND)


# Mehtab- 11-07-2024
class UserProfileView(viewsets.ModelViewSet):
    # permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        #return UserProfile.objects.all()
        return UserProfile.objects.filter(user__is_deleted=False) #nidhi


    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path=r'user_id/(?P<user_id>[^/.]+)')
    def get_user_id(self, request, user_id=None):
        #user_profiles = UserProfile.objects.filter(user_id=user_id)
        user_profiles = UserProfile.objects.filter(user_id=user_id, user__is_deleted=False) #nidhi

        if user_profiles.exists():
            serializer = self.get_serializer(user_profiles, many=True)
            return Response(serializer.data)
        else:
            return Response({"detail": "No profiles found for the provided user_id"}, status=status.HTTP_404_NOT_FOUND)

    def get_object_by_user_id(self, user_id):
        """Helper method to retrieve the UserProfile by user_id"""
        #return get_object_or_404(UserProfile, user_id=user_id)
        return get_object_or_404(UserProfile, user_id=user_id, user__is_deleted=False)

#Soumya Ranjan(25-10-2024)
    @action(detail=False, methods=['patch'], url_path=r'update_by_user_id/(?P<user_id>[^/.]+)')
    def update_profile_by_user_id(self, request, user_id=None):
        """Update specific details of a user profile by user_id, excluding username and email."""
        profile = self.get_object_by_user_id(user_id=user_id)

        # Use the serializer with partial=True for partial updates
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)

        # Validate and save
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "User profile updated successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post', 'put', 'patch',], url_path=r'user_id/(?P<user_id>[^/.]+)')
    def partial_update_by_user_id(self, request, user_id=None):
        """Handles partial updates to the user profile by user_id"""

        # Ensure we only update non-deleted users
        if instance.user.is_deleted: #nidhi
            return Response({"detail": "Cannot update a soft-deleted user profile."}, status=status.HTTP_400_BAD_REQUEST) #nidhi
        
        #$instance = self.get_object_by_user_id(user_id=user_id)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    #nidhi
    # Soft delete action
    @action(detail=False, methods=['delete'], url_path=r'user_id/(?P<user_id>[^/.]+)')
    def soft_delete_by_user_id(self, request, user_id=None):
        """Soft delete a user profile by user_id"""
        profile = self.get_object_by_user_id(user_id=user_id)
        profile.user.is_deleted = True
        profile.user.save()
        return Response({"detail": "User profile soft deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    #nidhi
    # Restore action
    @action(detail=False, methods=['post'], url_path=r'user_id/(?P<user_id>[^/.]+)/restore')
    def restore_by_user_id(self, request, user_id=None):
        """Restore a soft-deleted user profile by user_id"""
        profile = get_object_or_404(UserProfile, user_id=user_id, user__is_deleted=True)
        profile.user.is_deleted = False
        profile.user.save()
        return Response({"detail": "User profile restored successfully."}, status=status.HTTP_200_OK)


# Allocation
class LicenseAllocationViewSet(viewsets.ModelViewSet):
    queryset = LicenseAllocation.objects.all()
    serializer_class = LicenseAllocationSerializer

    @action(detail=False, methods=['get'], url_path='license/(?P<license_id>[^/.]+)')
    def list_allocations_by_license(self, request, license_id=None):
        allocations = LicenseAllocation.objects.filter(license__license_id=license_id)

        if allocations.exists():
            serializer = self.get_serializer(allocations, many=True)
            return Response(serializer.data)
        else:
            return Response({"detail": "No plugins found for the provided license_id"},
                            status=status.HTTP_404_NOT_FOUND)

#nidhi
#Enhanced License Allocation ViewSet with full License Report
    @action(detail=False, methods=['get'], url_path='license-report')
    def license_report(self, request):
        # Get all license allocations
        allocations = LicenseAllocation.objects.all()

        # Prepare the report data
        report_data = []
        for idx, allocation in enumerate(allocations, start=1):
            report_data.append({
                "S.No": idx,
                "License Key": allocation.license_id,
                "Allocated Email": allocation.allocated_to,
                "Allocation Date": allocation.allocation_date.strftime("%Y-%m-%d %H:%M:%S"),
                "Revoke Date": allocation.revoke_date.strftime("%Y-%m-%d %H:%M:%S") if allocation.revoke_date else "N/A",
                #"Revoke Reason": allocation.revoke_reason if allocation.revoke_reason else "N/A",
                "Status": "Inactive" if allocation.revoke_date else "Active",
                #"License Type": allocation.license_type,  # Assuming you have a field for this
                #"Expiry Date": allocation.valid_till.strftime("%Y-%m-%d %H:%M:%S") if allocation.valid_till else "Does not expire"
            })

        return Response({
            "message": "Full License report generated successfully.",
            "data": report_data
        }, status=status.HTTP_200_OK)


    @action(detail=False, methods=['get'], url_path='license/history-report/(?P<license_id>[^/.]+)')
    def get_license_details(self, request, license_id=None):
        # Retrieve all allocations for the specific license ID
        allocations = LicenseAllocation.objects.filter(license__license_id=license_id)

        if allocations.exists():
            allocation_data = []
            for allocation in allocations:
                serializer = self.get_serializer(allocation)
                data = serializer.data
                # Add status based on revoke_date
                data['status'] = 'Inactive' if allocation.revoke_date else 'Active'
                allocation_data.append(data)

            return Response(allocation_data, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "License allocation not found."},
                            status=status.HTTP_200_OK)        



class EmailDetailsViewSet(viewsets.ViewSet):
    def list(self, request):
        # Query both models
        email_details = EmailDetails.objects.all()  # Example query for one instance
        dispute_info = DisputeInfo.objects.all()  # Example query for one instance

        # Combine both querysets in one dictionary
        combined_data = {
            'email_details': email_details,
            'dispute_info': dispute_info
        }

        # Pass combined data to the custom serializer
        serializer = CombinedEmailDisputeSerializer(combined_data)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], url_path='update-status')
    def update_status(self, request):
        # Deserialize the request data
        serializer = EmailDetailsUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # Perform the update
            updated_email_detail = serializer.update(serializer.validated_data)
            return Response({
                'message': 'EmailDetails and DisputeInfo updated successfully',
                'updated_email_detail': {
                    'recievers_email': updated_email_detail.recievers_email,
                    'message_id': updated_email_detail.message_id,
                    'status': updated_email_detail.status
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# Rough URL ViewSet
class RoughURLViewSet(viewsets.ModelViewSet):
    queryset = RoughURL.objects.all()
    serializer_class = RoughURLSerializer

    # Custom message for GET (Retrieve a single object)
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
        except RoughURL.DoesNotExist:
            raise NotFound(detail=f"RoughUrl with id {kwargs['pk']} does not exist.")
        
        serializer = self.get_serializer(instance)
        return Response({
            "message": f"RoughUrl with id {kwargs['pk']} retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    
     # Custom message for GET (List all objects)
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)  # Handling pagination
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "message": "List of all RoughUrls retrieved successfully.",
                "data": serializer.data
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "List of all RoughUrls retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    # Custom message for POST (Create a new object)
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            "message": "RoughUrl created successfully.",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)

    # Custom message for PATCH (Partial update of an object)
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            "message": f"RoughUrl with id {kwargs['pk']} updated successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    # Custom message for DELETE (Delete an object)
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "message": f"RoughUrl with id {kwargs['pk']} has been deleted successfully."
        }, status=status.HTTP_200_OK)
    

# Rough Domain ViewSet
class RoughDomainViewSet(viewsets.ModelViewSet):
    queryset = RoughDomain.objects.all()
    serializer_class = RoughDomainSerializer
    authentication_classes = [SessionAuthentication]  # Corrected placement

    # Custom message for GET (Retrieve a single object)
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
        except RoughDomain.DoesNotExist:
            raise NotFound(detail=f"RoughDomain with id {kwargs['pk']} does not exist.")
        
        serializer = self.get_serializer(instance)
        return Response({
            "message": f"RoughDomain with id {kwargs['pk']} retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    # Custom message for GET (List all objects)
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "message": "List of all RoughDomains retrieved successfully.",
                "data": serializer.data
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "List of all RoughDomains retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    # Custom message for POST (Create a new object)
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            "message": "RoughDomain created successfully.",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)

    # Custom message for PATCH/PUT (Update an object)
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            "message": f"RoughDomain with id {kwargs['pk']} updated successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    # Custom message for DELETE (Destroy an object)
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "message": f"RoughDomain with id {kwargs['pk']} has been deleted successfully."
        }, status=status.HTTP_200_OK)
    
# Rough Mail ViewSet

class RoughMailViewSet(viewsets.ModelViewSet):
    queryset = RoughMail.objects.all()
    serializer_class = RoughMailSerializer

    # Custom message for GET (Retrieve a single object)
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
        except RoughMail.DoesNotExist:
            raise NotFound(detail=f"RoughMail with id {kwargs['pk']} does not exist.")
        
        serializer = self.get_serializer(instance)
        return Response({
            "message": f"RoughMail with id {kwargs['pk']} retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    # Custom message for GET (List all objects)
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "message": "List of all RoughMails retrieved successfully.",
                "data": serializer.data
            })
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "List of all RoughMails retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    # Custom message for POST (Create a new object)
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            "message": "RoughMail created successfully.",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)

    # Custom message for PATCH/PUT (Update an object)
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            "message": f"RoughMail with id {kwargs['pk']} updated successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    # Custom message for DELETE (Destroy an object)
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "message": f"RoughMail with id {kwargs['pk']} has been deleted successfully."
        }, status=status.HTTP_200_OK)

# Soumya Ranjan
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def save_machine_info(request):
    if 'file' not in request.FILES:
        return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

    uploaded_file = request.FILES['file']
    file_path = default_storage.save(uploaded_file.name, uploaded_file)

    with open(file_path, 'r') as json_file:
        try:
            machine_info_data = json.load(json_file)
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON file"}, status=status.HTTP_400_BAD_REQUEST)

    hardware_info = machine_info_data.get("hardware_info", {})

    # Serialize and save the data to the database
    serializer = MachineDataSerializer(data={
        "machine_id": machine_info_data.get("machine_id", ""),
        "system": hardware_info.get("system", ""),
        "machine": hardware_info.get("machine", ""),
        "processor": hardware_info.get("processor", ""),
        "platform_version": hardware_info.get("platform_version", ""),
        "serial_number": hardware_info.get("serial_number", ""),
        "uuid": hardware_info.get("uuid", ""),
        "mac_addresses": hardware_info.get("mac_addresses", []),  # List of MAC addresses
    })

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_disabled_plugins_count(request):
    fifteen_minutes_ago = timezone.now() - timedelta(minutes=15)
    disabled_plugins = PluginEnableDisable.objects.filter(disabled_at__gte=fifteen_minutes_ago)

    disabled_plugins_data = []

    for plugin_action in disabled_plugins:
        time_diff = timezone.now() - plugin_action.disabled_at
        minutes, seconds = divmod(time_diff.total_seconds(), 60)

        disabled_plugins_data.append({
            "plugin_id": plugin_action.plugin_install_uninstall.plugin_id,
            "user_name": plugin_action.user_profile.user.username,
            "last_active": f"{int(minutes)} minutes, {int(seconds)} seconds"
        })

    return Response({
        "disabled_plugins_count": disabled_plugins.count(),
        "disabled_plugins_details": disabled_plugins_data

    })

class DisputeStatusUpdateView(generics.UpdateAPIView):
    queryset = Dispute.objects.all()
    serializer_class = DisputeSerializer

# View to add a new comment on DisputeInfo
class DisputeCommentCreateView(generics.CreateAPIView):
    queryset = DisputeInfo.objects.all()
    serializer_class = DisputeCommentSerializer

class AvailableAttachmentsView(APIView):
    def get(self, request):
        attachments = Attachment.objects.filter(attachment__isnull=False)
        serializer = AttachmentSerializer(attachments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

