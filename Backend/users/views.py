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
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from drf_yasg.utils import swagger_auto_schema
from datetime import datetime
from django.utils import timezone
from datetime import timedelta
from .models import RoughURL, RoughDomain, RoughMail
from rest_framework.exceptions import ValidationError
from .serializers import RoughURLSerializer, RoughDomainSerializer, RoughMailSerializer, DisputeUpdateSerializer, AttachmentSerializer
from rest_framework import status
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
import json
from django.core.files.storage import default_storage
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, parser_classes
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth.hashers import make_password, check_password
from django.db.models import Count
from django.db.models.functions import TruncMonth
import pytz
import random
from django.conf import settings
from .models import OTP
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.generics import CreateAPIView
from django.utils.timezone import localtime
from django.template.loader import render_to_string
from django.db.models import Max, Subquery, OuterRef
from rest_framework.exceptions import NotFound
from django.http import Http404
from django.utils.timezone import now
from rest_framework.pagination import PageNumberPagination
User = get_user_model()

class ApiListPagination(PageNumberPagination):
    """
    Custom pagination class to define default page size and page query parameter.
    """
    page_size = 10
    page_query_param = 'page'
    page_size_query_param = 'page_size'
    max_page_size = 100

class LoginViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    @swagger_auto_schema(request_body=LoginSerializer)
    def create(self, request):
        """
               Authenticate a user and generate an authentication token.

               Args:
                   request: The HTTP request object containing user credentials.

               Returns:
                   Response: A JSON response containing the following:
                       - `user`: Serialized user data.
                       - `token`: Authentication token.
                       - `role`: The user's role (`superuser`, `staff`, or `user`).
                       - `message`: A success message with the role.

                   If authentication fails:
                       - `error`: Error message indicating invalid credentials.
                       - HTTP status code 401 (Unauthorized).

                   If validation fails:
                       - Validation errors and HTTP status code 400 (Bad Request).
               """
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
    serializer_class = RegisterSerializer

    def create(self, request):
        """
        Create a new user account.

        Args:
            request: The HTTP request object containing user registration details.

        Returns:
            Response: Serialized user data on success or a single error message as plain text on failure.
        """
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.save()  # Create the user and the profile automatically
            return Response(serializer.data, status=201)
        else:
            # Extract the first error message directly
            error_message = next(iter(serializer.errors.values()))[0]
            return Response({"message": error_message}, status=400)
class UserViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def list(self, request):
        """
        List all active staff users (excluding superusers).
        """
        queryset = User.objects.filter(
            is_deleted=False, is_staff=True, is_superuser=False
        ).select_related('userprofile')  # Preload UserProfile
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


    @action(detail=True, methods=['delete'], url_path='soft-delete')
    def soft_delete(self, request, pk=None):
        """
        Perform a soft delete on a user.

        Marks the user as deleted by setting `is_deleted` to True without removing them from the database.

        Args:
            request: The HTTP request object.
            pk: The primary key of the user to be soft-deleted.

        Returns:
            Response: A JSON response with a success message and HTTP status 204 (No Content).
            If the user is not found:
                - HTTP status 404 (Not Found).
        """
        user = get_object_or_404(User, pk=pk, is_deleted=False)
        user.delete()
        return Response({"detail": "User soft deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        """
                Restore a previously soft-deleted user.

                Sets the `is_deleted` flag to False, effectively restoring the user.

                Args:
                    request: The HTTP request object.
                    pk: The primary key of the user to be restored.

                Returns:
                    Response: A JSON response with a success message and HTTP status 200 (OK).
                    If the user is not found:
                        - HTTP status 404 (Not Found).
                """
        user = get_object_or_404(User, pk=pk, is_deleted=True)
        user.restore()  # This will restore the user
        return Response({"detail": "User restored successfully."}, status=status.HTTP_200_OK)
class StaffViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    def list(self, request):
        """
        List all staff users (excluding superusers) and provide their total count.

        Fetches all users who meet the following criteria:
        - `is_staff` is True.
        - `is_superuser` is False.

        The response includes the total count of such users and their serialized data.

        Args:
            request: The HTTP request object.

        Returns:
            Response: A JSON response containing:
                - `count`: The total number of staff users.
                - `results`: A list of serialized staff user data.
        """
        queryset = User.objects.filter(is_staff=True,is_superuser=False)
        count = queryset.count()
        serializer = self.serializer_class(queryset, many=True)
        return Response({
            'count': count,
            'results': serializer.data
        })
class ChangePasswordViewset(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer
    def create(self, request):
        """
        Handle a password change request for an authenticated user.

        The process includes:
        - Validating the old password.
        - Ensuring the new password is unique from the last three passwords used.
        - Updating the user's password.
        - Storing the new password in the password history.

        Args:
            request: The HTTP request object containing `old_password` and `new_password`.

        Returns:
            Response: A JSON response with the following:
                - On success: A success message with HTTP status 201 (Created).
                - On failure:
                    - HTTP 401 (Unauthorized) if the old password is incorrect.
                    - HTTP 400 (Bad Request) if the new password is not unique or validation fails.
        """
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_password = serializer.validated_data.get('old_password')
            new_password = serializer.validated_data.get('new_password')
            if not user.check_password(old_password):
                return Response({'error': 'Wrong password'}, status=status.HTTP_401_UNAUTHORIZED)
            recent_passwords = PasswordHistory.objects.filter(user=user).order_by('-created_at')[:3]
            for record in recent_passwords:
                if check_password(new_password, record.hashed_password):
                    return Response(
                        {'error': 'The new password must be unique from your previous three passwords!'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            user.set_password(new_password)
            user.save()
            PasswordHistory.objects.create(user=user, hashed_password=user.password)
            if recent_passwords.count() >= 3:
                oldest_password = recent_passwords.last()
                oldest_password.delete()
            return Response({'message': 'Password changed successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class PasswordResetRequestViewset(mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetRequestSerializer
    def create(self, request, *args, **kwargs):
        """
        Handle a password reset request by generating a reset link.

        The process includes:
        - Validating the email input.
        - Checking if the email corresponds to a registered user.
        - Generating a password reset token and UID for the user.
        - Sending a password reset email with a link to reset the password.

        Args:
            request: The HTTP request object containing the `email`.

        Returns:
            Response: A JSON response with the following:
                - On success: A message confirming the password reset email was sent, with HTTP status 200 (OK).
                - On failure:
                    - HTTP 400 (Bad Request) if the email is not valid or does not exist in the database.
        """
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
            send_mail(
                'Password Reset Request',
                message,
                'no-reply@yourdomain.com',
                [user.email],
                fail_silently=False,
            )
            return Response({'message': 'Password reset email sent.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class PasswordResetViewset(mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = PasswordResetSerializer
    def create(self, request, *args, **kwargs):
        """
             Handle the password reset process.

             The process includes:
             - Validating the UID and token.
             - Ensuring the UID corresponds to a valid user.
             - Ensuring the token is valid and has not expired.
             - Updating the user's password with the provided new password.

             Args:
                 request: The HTTP request object containing `uid`, `token`, and `new_password`.

             Returns:
                 Response: A JSON response with the following:
                     - On success: A message confirming the password reset was successful, with HTTP status 200 (OK).
                     - On failure:
                         - HTTP 400 (Bad Request) if the UID is invalid, the token is invalid/expired,
                           or the provided data fails validation.
             """
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
class LicenseListView(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = License.objects.all()
    serializer_class = LicenseSerializer
    pagination_class = ApiListPagination
    def list(self, request):
        """
           List licenses based on the user's role.

           If the user is a superuser, all licenses are listed. Otherwise, only non-reserved licenses are displayed.

           Returns:
               - A JSON response containing license details.
               - 401 Unauthorized if the user is not authenticated.
           """
        current_user = request.user
        if not current_user.is_authenticated:
            return Response({'error': 'Login required to access licenses.'}, status=status.HTTP_401_UNAUTHORIZED)
        user_email = current_user.email
        try:
           user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        user_is_active = user.is_active
        user_is_staff=user.is_staff
        user_is_superuser=user.is_superuser
        if user_is_superuser:
           queryset = License.objects.all() 
        else:
           queryset = License.objects.filter(is_reserved=0)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.serializer_class(queryset, many=True)
        count = queryset.count()
        return Response(serializer.data, status=status.HTTP_200_OK)
    @action(detail=True, methods=['post'])
    def allocate(self, request, pk=None):
        """
        Allocate a license to a specific user.

        This action assigns a license to a user and sends an email confirmation.

        Args:
            pk: The primary key of the license to allocate.

        Returns:
            - 200 OK if the allocation is successful.
            - 400 Bad Request if there is an error.
        """
        try:
            license = self.get_object()
            allocated_to = request.data.get('allocated_to')
            if not allocated_to:
                return Response({'error': 'allocated_to is required'}, status=status.HTTP_400_BAD_REQUEST)
            allocation_date = timezone.now()
            formatted_allocation_date = allocation_date.strftime('%d-%m-%Y %I:%M:%S %p')
            license.allocated_to = allocated_to
            license.status = 1
            license.save()
            LicenseAllocation.objects.create(
                license=license,
                allocated_to=allocated_to,
                allocation_date=allocation_date
            )
            download_url = request.build_absolute_uri('/plugin/download-agent/')
            html_message = render_to_string('license_allocation.html', {
            'allocated_to': allocated_to,
            'formatted_allocation_date': formatted_allocation_date,
            'license': license,
            'download_link': download_url
        })
            send_mail(
            subject='License Allocation',
            message='',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[allocated_to],
            fail_silently=False,
            html_message=html_message
        )
            return Response({'status': 'License allocated successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=False, methods=['post'], url_path='revoke-license/(?P<license_id>[^/.]+)')
    def revoke_license(self, request, license_id=None):
        """
        Revoke an allocated license.

        Args:
            license_id: The ID of the license to revoke.

        Returns:
            - 200 OK if the revocation is successful.
            - 404 Not Found if the license is not found.
        """
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
        """
        Update license details by its ID.

        Args:
            license_id: The ID of the license to update.

        Returns:
            - Updated license details on success.
            - 404 Not Found if the license is not found.
        """
        try:
            license_instance = License.objects.get(license_id=license_id)
        except License.DoesNotExist:
            return Response({"detail": "License not found"}, status=status.HTTP_404_NOT_FOUND)
        data = request.data
        if 'allocated_to' in data:
            license_instance.allocated_to = ""
            license_instance.status = 0
        license_instance.save()
        serializer = LicenseSerializer(license_instance)
        return Response(serializer.data, status=status.HTTP_200_OK)
    @action(detail=False, methods=['POST'], url_path='create-multiple-license')
    def create_multiple_license_id(self, request):
        """
        Create multiple license IDs in bulk.

        Args:
            - number_of_licenses: The number of licenses to create.
            - organisation: The organisation to assign licenses to.
            - valid_from: Start date for license validity.
            - valid_till: End date for license validity.

        Returns:
            - 200 OK if licenses are created successfully.
            - 400 Bad Request if there is an error in input data.
        """
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
        
        if valid_from:
            valid_from = valid_from.replace(tzinfo=None)
        if valid_till:
            valid_till = valid_till.replace(tzinfo=None)
        last_license = License.objects.filter(license_id__startswith="LIC-").order_by('-license_id').first()
        base_license_number = int(last_license.license_id.split('-')[1]) + 1 if last_license else 1
        licenses_to_create = []
        for i in range(number_of_licenses):
            serial_number = base_license_number + i
            license_id = f"LIC-{serial_number:05d}"
            license = License(
                license_id=license_id,
                organisation=organisation,
                valid_from=valid_from,
                valid_till=valid_till,
            )
            licenses_to_create.append(license)
        if licenses_to_create:
            License.objects.bulk_create(licenses_to_create)
            return Response({"message": f"{number_of_licenses} license IDs created successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "No licenses were created."}, status=status.HTTP_400_BAD_REQUEST)
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
        if not user.is_superuser:
            return Response({"detail": "You do not have permission to perform this action."}, status=status.HTTP_403_FORBIDDEN)
        action = request.data.get('action')
        try:
            license_instance = License.objects.get(license_id=pk)
            if action == '1':
                if license_instance.status == '1':
                    return Response({"message": "License is already activated. Please revoke it before inactivating."}, status=status.HTTP_200_OK)
                if license_instance.is_reserved:
                    return Response({"message": "License is already reserved."}, status=status.HTTP_200_OK)
                license_instance.is_reserved = True
                license_instance.save()
                message = "License has been reserved."
            elif action == '0':
                if not license_instance.is_reserved:
                    return Response({"message": "License is not currently reserved."}, status=status.HTTP_400_BAD_REQUEST)
                license_instance.is_reserved = False
                license_instance.save()
                message = "License has been unreserved."
            else:
                return Response({"message": "Invalid action specified. Use '1' to reserve or '0' to unreserve."}, status=status.HTTP_400_BAD_REQUEST)
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
        """
        Retrieve all plugins.

        This method retrieves all PluginMaster objects from the database
        and returns them in serialized form.

        Returns:
            - A JSON response containing details of all plugins.
        """
        queryset = PluginMaster.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    @action(detail=False, methods=['get'], url_path='by-license/(?P<license_id>[^/.]+)')
    def get_by_license_id(self, request, license_id=None):
        """
        Retrieve plugins associated with a specific license ID.

        This custom action fetches PluginMaster objects linked to the provided license ID.

        Args:
            license_id: The ID of the license to filter plugins by.

        Returns:
            - A JSON response containing details of the associated plugins if found.
            - 404 Not Found if no plugins are associated with the given license ID.
        """
        plugins = PluginMaster.objects.filter(license_id__license_id=license_id)
        if plugins.exists():
            serializer = self.get_serializer(plugins, many=True)
            return Response(serializer.data)
        else:
            return Response({"detail": "No plugins found for the provided license_id"},
                            status=status.HTTP_404_NOT_FOUND)
class UserProfileView(viewsets.ModelViewSet):
    # permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    def get_queryset(self):
        """
        Retrieve all user profiles where the associated user is not soft-deleted.

        Returns:
            - Queryset of UserProfile objects.
        """
        return UserProfile.objects.filter(user__is_deleted=False)
    def list(self, request):
        """
        Retrieve a list of all non-soft-deleted user profiles.

        Returns:
            - A JSON response containing serialized user profile data.
        """
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    @action(detail=False, methods=['get'], url_path=r'user_id/(?P<user_id>[^/.]+)')
    def get_user_id(self, request, user_id=None):
        """
        Retrieve a user profile or user data by user ID.

        Args:
            - user_id: The ID of the user whose profile or data is to be retrieved.

        Returns:
            - Serialized user profile data if found.
            - Basic user data if the user exists but has no profile.
            - 404 error if no data is found.
        """
        user_profiles = UserProfile.objects.filter(user_id=user_id, user__is_deleted=False)
        if user_profiles.exists():
            user_profile = user_profiles.first()
            user_profile_serializer = UserProfileSerializer(user_profile)
            return Response(user_profile_serializer.data)
        else:
            try:
                user = User.objects.get(id=user_id, is_deleted=False)
                user_data = {
                    "phone_number": "",
                    "address": "",
                    "organization": "",
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "full_name": user.get_full_name(),
                    "email": user.email
                }
                return Response(user_data)
            except User.DoesNotExist:
                return Response({"detail": "No data found for the provided user_id"}, status=status.HTTP_404_NOT_FOUND)
    def get_object_by_user_id(self, user_id):
        """
         Helper method to retrieve the UserProfile by user ID.

         If no profile exists, it attempts to retrieve the User object.

         Args:
             - user_id: The ID of the user.

         Returns:
             - UserProfile or User instance.
             - 404 error if no matching object is found.
         """
        try:
            return get_object_or_404(UserProfile, user_id=user_id, user__is_deleted=False)
        except Http404:
            try:
                return get_object_or_404(User, id=user_id, is_deleted=False)
            except Http404:
                return Response({"detail": "No data found for the provided user_id"}, status=status.HTTP_404_NOT_FOUND)
    @action(detail=False, methods=['patch'], url_path=r'update_by_user_id/(?P<user_id>[^/.]+)')
    def update_profile_by_user_id(self, request, user_id=None):
        """
        Update specific details of a user profile by user ID.

        Excludes fields such as username and email from being updated.

        Args:
            - user_id: The ID of the user profile to update.

        Returns:
            - Success message if update is successful.
            - 400 error if validation fails.
        """
        profile = self.get_object_by_user_id(user_id=user_id)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "User profile updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    @action(detail=False, methods=['post', 'put', 'patch',], url_path=r'user_id/(?P<user_id>[^/.]+)')
    def partial_update_by_user_id(self, request, user_id=None):
        """
        Handle partial updates to the user profile by user ID.

        Args:
            - user_id: The ID of the user profile to update.

        Returns:
            - Updated user profile data.
            - 400 error if the user is soft-deleted or validation fails.
        """
        if instance.user.is_deleted: #nidhi
            return Response({"detail": "Cannot update a soft-deleted user profile."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    @action(detail=False, methods=['delete'], url_path=r'user_id/(?P<user_id>[^/.]+)')
    def soft_delete_by_user_id(self, request, user_id=None):
        """
        Soft delete a user profile by user ID.

        Marks the `is_deleted` flag on the associated user.

        Args:
            - user_id: The ID of the user profile to soft delete.

        Returns:
            - Success message if the soft delete is successful.
        """
        profile = self.get_object_by_user_id(user_id=user_id)
        profile.user.is_deleted = True
        profile.user.save()
        return Response({"detail": "User profile soft deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
    @action(detail=False, methods=['post'], url_path=r'user_id/(?P<user_id>[^/.]+)/restore')
    def restore_by_user_id(self, request, user_id=None):
        """
        Restore a soft-deleted user profile by user ID.

        Args:
            - user_id: The ID of the user profile to restore.

        Returns:
            - Success message if the restoration is successful.
            - 404 error if no matching soft-deleted profile is found.
        """
        profile = get_object_or_404(UserProfile, user_id=user_id, user__is_deleted=True)
        profile.user.is_deleted = False
        profile.user.save()
        return Response({"detail": "User profile restored successfully."}, status=status.HTTP_200_OK)
class LicenseAllocationViewSet(viewsets.ModelViewSet):
    queryset = LicenseAllocation.objects.all()
    serializer_class = LicenseAllocationSerializer
    pagination_class = ApiListPagination
    @action(detail=False, methods=['get'], url_path='license/(?P<license_id>[^/.]+)')
    def list_allocations_by_license(self, request, license_id=None):
        """
        Retrieve all license allocations associated with a specific license ID.

        Args:
            - license_id: The license ID for which allocations need to be retrieved.

        Returns:
            - List of allocations serialized data if allocations exist.
            - 404 error if no allocations found for the given license ID.
        """
        allocations = LicenseAllocation.objects.filter(license__license_id=license_id)
        if allocations.exists():
            serializer = self.get_serializer(allocations, many=True)
            return Response(serializer.data)
        else:
            return Response({"detail": "No plugins found for the provided license_id"},
                            status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='license-report')
    def license_report(self, request):
        """
         Generate a full report of all license allocations.

         The report includes:
         - Serial number
         - License key
         - Allocated email
         - Allocation and revoke dates
         - Allocation status (Active/Inactive)

         Returns:
             - A detailed license allocation report in JSON format.
        """
        allocations = LicenseAllocation.objects.all()
        report_data = []
        for idx, allocation in enumerate(allocations, start=1):
            report_data.append({
                "S.No": idx,
                "License Key": allocation.license_id,
                "Allocated Email": allocation.allocated_to,
                "Allocation Date": allocation.allocation_date.strftime("%Y-%m-%d %H:%M:%S"),
                "Revoke Date": allocation.revoke_date.strftime(
                    "%Y-%m-%d %H:%M:%S") if allocation.revoke_date else "N/A",
                "Status": "Inactive" if allocation.revoke_date else "Active",
            })
        paginator = self.pagination_class()
        paginated_report_data = paginator.paginate_queryset(report_data, request)

        if paginated_report_data is not None:
            return paginator.get_paginated_response(paginated_report_data)

        return Response({
            "message": "Full License report generated successfully.",
            "data": report_data
        }, status=status.HTTP_200_OK)
    @action(detail=False, methods=['get'], url_path='license/history-report/(?P<license_id>[^/.]+)')
    def get_license_details(self, request, license_id=None):
        """
        Retrieve the detailed history of allocations for a specific license.

        Args:
            - license_id: The license ID for which allocation history is required.

        Returns:
            - Allocation history for the given license, with status (Active/Inactive).
            - 200 status if allocations exist.
            - 404 status if no allocations found for the license.
        """
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
    pagination_class = ApiListPagination

    def list(self, request):
        """
        Retrieve a combined list of all EmailDetails and DisputeInfo data.

        Returns:
            - A JSON response containing serialized EmailDetails and DisputeInfo data.
        """
        # Query data
        email_details = EmailDetails.objects.all()
        dispute_info = DisputeInfo.objects.all()

        # Serialize data
        email_serializer = EmailDetailsSerializer(email_details, many=True)
        dispute_serializer = DisputeInfoSerializer(dispute_info, many=True)

        combined_data = email_serializer.data + dispute_serializer.data

        # Paginate combined data
        paginator = self.pagination_class()
        paginated_combined_data = paginator.paginate_queryset(combined_data, request)

        if paginated_combined_data is not None:
            return paginator.get_paginated_response(paginated_combined_data)

        return Response(combined_data)
    @action(detail=False, methods=['patch'], url_path='update-status')
    def update_status(self, request):
        """
        Update the status of an EmailDetails record and the associated DisputeInfo record.

        This action expects the new status and other necessary fields to be provided
        in the request data. It will update both the EmailDetails and DisputeInfo models.

        Returns:
            - A JSON response with a success message and the updated EmailDetails.
            - 400 error if the provided data is invalid.
        """
        serializer = EmailDetailsUpdateSerializer(data=request.data)
        if serializer.is_valid():
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
class RoughURLViewSet(viewsets.ModelViewSet):
    queryset = RoughURL.objects.all()
    serializer_class = RoughURLSerializer
    def retrieve(self, request, *args, **kwargs):
        """
          Retrieve a specific RoughURL by its ID.

          Args:
              - pk (str): The ID of the RoughURL to retrieve.

          Returns:
              - A JSON response containing the retrieved RoughURL data.
              - 404 error if the RoughURL does not exist.
          """
        try:
            instance = self.get_object()
        except RoughURL.DoesNotExist:
            raise NotFound(detail=f"RoughUrl with id {kwargs['pk']} does not exist.")
        serializer = self.get_serializer(instance)
        return Response({
            "message": f"RoughUrl with id {kwargs['pk']} retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        """
        Retrieve a list of all RoughURLs without pagination.

        Returns:
            - A JSON response containing a list of all RoughURLs.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "List of all RoughUrls retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    def create(self, request, *args, **kwargs):
        """
        Create a new RoughURL.

        Args:
            - request.data: The data to create the RoughURL.

        Returns:
            - A JSON response confirming the creation of the RoughURL.
            - 400 error if the data is invalid.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            "message": "RoughUrl created successfully.",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)
    def partial_update(self, request, *args, **kwargs):
        """
        Partially update an existing RoughURL by its ID.

        Args:
            - pk (str): The ID of the RoughURL to update.
            - request.data: The data to partially update the RoughURL.

        Returns:
            - A JSON response confirming the update of the RoughURL.
            - 404 error if the RoughURL does not exist.
            - 400 error if the data is invalid.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            "message": f"RoughUrl with id {kwargs['pk']} updated successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    def destroy(self, request, *args, **kwargs):
        """
        Delete a RoughURL by its ID.

        Args:
            - pk (str): The ID of the RoughURL to delete.

        Returns:
            - A JSON response confirming the deletion of the RoughURL.
            - 404 error if the RoughURL does not exist.
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "message": f"RoughUrl with id {kwargs['pk']} has been deleted successfully."
        }, status=status.HTTP_200_OK)
class RoughDomainViewSet(viewsets.ModelViewSet):
    queryset = RoughDomain.objects.all()
    serializer_class = RoughDomainSerializer
    authentication_classes = [SessionAuthentication]
    def retrieve(self, request, *args, **kwargs):
        """
         Retrieve a specific RoughDomain by its ID.

         Args:
             - pk (str): The ID of the RoughDomain to retrieve.

         Returns:
             - A JSON response containing the retrieved RoughDomain data.
             - 404 error if the RoughDomain does not exist.
         """
        try:
            instance = self.get_object()
        except RoughDomain.DoesNotExist:
            raise NotFound(detail=f"RoughDomain with id {kwargs['pk']} does not exist.")
        serializer = self.get_serializer(instance)
        return Response({
            "message": f"RoughDomain with id {kwargs['pk']} retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        """
        Retrieve a list of all RoughDomains without pagination.

        Returns:
            - A JSON response containing a list of all RoughDomains.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "List of all RoughDomains retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    def create(self, request, *args, **kwargs):
        """
        Create a new RoughDomain.

        Args:
            - request.data: The data to create the RoughDomain.

        Returns:
            - A JSON response confirming the creation of the RoughDomain.
            - 400 error if the data is invalid.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            "message": "RoughDomain created successfully.",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)
    def update(self, request, *args, **kwargs):
        """
               Update an existing RoughDomain by its ID.

               Args:
                   - pk (str): The ID of the RoughDomain to update.
                   - request.data: The data to update the RoughDomain.

               Returns:
                   - A JSON response confirming the update of the RoughDomain.
                   - 404 error if the RoughDomain does not exist.
                   - 400 error if the data is invalid.
               """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            "message": f"RoughDomain with id {kwargs['pk']} updated successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    def destroy(self, request, *args, **kwargs):
        """
                Delete a RoughDomain by its ID.

                Args:
                    - pk (str): The ID of the RoughDomain to delete.

                Returns:
                    - A JSON response confirming the deletion of the RoughDomain.
                    - 404 error if the RoughDomain does not exist.
                """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "message": f"RoughDomain with id {kwargs['pk']} has been deleted successfully."
        }, status=status.HTTP_200_OK)
class RoughMailViewSet(viewsets.ModelViewSet):
    queryset = RoughMail.objects.all()
    serializer_class = RoughMailSerializer
    def retrieve(self, request, *args, **kwargs):
        """
                Retrieve a specific RoughMail by its ID.

                Args:
                    - pk (str): The ID of the RoughMail to retrieve.

                Returns:
                    - A JSON response containing the retrieved RoughMail data.
                    - 404 error if the RoughMail does not exist.
                """
        try:
            instance = self.get_object()
        except RoughMail.DoesNotExist:
            raise NotFound(detail=f"RoughMail with id {kwargs['pk']} does not exist.")
        serializer = self.get_serializer(instance)
        return Response({
            "message": f"RoughMail with id {kwargs['pk']} retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        """
        Retrieve a list of all RoughMails without pagination.

        Returns:
            - A JSON response containing a list of all RoughMails.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "message": "List of all RoughMails retrieved successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    def create(self, request, *args, **kwargs):
        """
        Create a new RoughMail.

        Args:
            - request.data: The data to create the RoughMail.

        Returns:
            - A JSON response confirming the creation of the RoughMail.
            - 400 error if the data is invalid.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            "message": "RoughMail created successfully.",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)
    def update(self, request, *args, **kwargs):
        """
           Update an existing RoughMail by its ID.

           Args:
               - pk (str): The ID of the RoughMail to update.
               - request.data: The data to update the RoughMail.

           Returns:
               - A JSON response confirming the update of the RoughMail.
               - 404 error if the RoughMail does not exist.
               - 400 error if the data is invalid.
           """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            "message": f"RoughMail with id {kwargs['pk']} updated successfully.",
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    def destroy(self, request, *args, **kwargs):
        """
        Delete a RoughMail by its ID.

        Args:
            - pk (str): The ID of the RoughMail to delete.

        Returns:
            - A JSON response confirming the deletion of the RoughMail.
            - 404 error if the RoughMail does not exist.
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            "message": f"RoughMail with id {kwargs['pk']} has been deleted successfully."
        }, status=status.HTTP_200_OK)
@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def save_machine_info(request):
    """
    API view to handle the upload and processing of machine info JSON file.

    The file should contain machine-specific details such as system, machine type, processor, etc.
    This data is saved into the MachineData model.

    Args:
        - request.FILES: The file containing machine information in JSON format.

    Returns:
        - A JSON response containing the machine info if saved successfully.
        - 400 error if the file is invalid or missing.
    """
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
    """
    API view to retrieve the count of disabled plugins within the last 15 minutes.

    The response includes a list of disabled plugins along with the time since they were last disabled.

    Returns:
        - A JSON response containing the count of disabled plugins and their details.
    """
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
    """
    API view for updating the status of a Dispute.
    """
    queryset = Dispute.objects.all()
    serializer_class = DisputeSerializers

    def update(self, request, *args, **kwargs):
        """
        Overrides the default update method to handle exceptions and provide meaningful responses.
        """
        try:
            response = super().update(request, *args, **kwargs)
            return Response({
                "message": "Dispute status updated successfully.",
                "data": response.data
            }, status=status.HTTP_200_OK)
        except serializers.ValidationError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "error": "An unexpected error occurred.",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DisputeCommentCreateView(CreateAPIView):
    """
    API view to create a comment for a specific dispute.
    """
    queryset = DisputeInfo.objects.all()
    serializer_class = DisputeCommentSerializer
    # permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Overridden to handle any custom save logic if needed.
        """
        serializer.save()


class AvailableAttachmentsView(APIView):
    pagination_class = ApiListPagination

    def get(self, request):
        """
        Retrieve a list of all available attachments.

        Filters out attachments that are null or empty.

        Returns:
            - A paginated JSON response with the list of available attachments,
            - Or an empty list with a custom message if no records are found.
        """
        attachments = Attachment.objects.exclude(attachment__isnull=True).exclude(attachment='')

        if attachments.exists():
            # Paginate the queryset
            paginator = self.pagination_class()
            paginated_attachments = paginator.paginate_queryset(attachments, request)

            # Serialize the paginated queryset
            serializer = AttachmentSerializer(paginated_attachments, many=True)

            # Return the paginated response
            return paginator.get_paginated_response({"data": serializer.data, "message": "Records found"})
        else:
            # If no attachments are found, return an empty list with a custom message
            return Response(
                {"data": [], "message": "No records found"},
                status=status.HTTP_200_OK
            )


class PendingAttachmentsView(generics.ListAPIView):
    """
    API endpoint that lists all Attachments associated with EmailDetails records
    where the status is 'pending' and the attachment is not null.
    """
    serializer_class = AttachmentSerializer

    def get_queryset(self):
        return Attachment.objects.filter(
            email_detail__status='pending',
            attachment__isnull=False
        ).exclude(attachment='').order_by('created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if queryset.exists():
            # If there are records, serialize them and return the response
            serializer = self.get_serializer(queryset, many=True)
            return Response({"data": serializer.data, "message": "Records found"}, status=status.HTTP_200_OK)
        else:
            # If no records found, return an empty list with a custom message
            return Response(
                {"data": [], "message": "No records found"},
                status=status.HTTP_200_OK
            )


class quarentineAttachmentsView(generics.ListAPIView):
    """
    API endpoint that lists all Attachments associated with EmailDetails records
    where the status is 'pending', the attachment is not null, and ai_status is either
    'Unsafe', 'Exception', or 'Failed'.
    """
    serializer_class = AttachmentSerializer

    def get_queryset(self):
        return Attachment.objects.filter(
            email_detail__status='pending',
            attachment__isnull=False,
            ai_status__in=[2, 3, 4]  # Filter for 'Unsafe', 'Exception', 'Failed'
        ).exclude(attachment='').order_by('created_at')
class MonthlyCombinedEmailAndAttachmentCount(APIView):
    def get(self, request, *args, **kwargs):
        user_timezone = request.query_params.get('timezone', 'Asia/Kolkata')
        try:
            target_tz = pytz.timezone(user_timezone)
        except pytz.UnknownTimeZoneError:
            return Response({"error": "Invalid timezone provided."}, status=status.HTTP_400_BAD_REQUEST)
        def convert_month_to_timezone(data, target_tz):
            """
            Converts the month data from naive datetime to the target timezone and formats it as 'YYYY-MM'.

            Args:
                - data (list): List of dictionaries containing 'month' and 'count'.
                - target_tz (timezone): Target timezone for conversion.

            Returns:
                - List of dictionaries with the 'month' converted to the target timezone.
            """
            converted_data = []
            for entry in data:
                month = entry['month']
                if month is None:
                    continue
                if timezone.is_naive(month):
                    month = timezone.make_aware(month, timezone=target_tz)
                converted_month = month.astimezone(target_tz)
                entry['month'] = converted_month.strftime('%Y-%m')
                converted_data.append(entry)
            return converted_data
        sandbox_data = (
            Attachment.objects.filter(attachment__isnull=False)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        total_mail = (
            EmailDetails.objects.filter(Emailsattachments__attachment__isnull=False)
            .annotate(month=TruncMonth('create_time'))
            .values('month')
            .annotate(count=Count('msg_id', distinct=True))
            .order_by('month')
        )
        CDR_Completed = (
            Attachment.objects.filter(ai_status=2)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        impacted_found = (
            Attachment.objects.filter(ai_status__in=[3, 4])
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        sandbox_data = convert_month_to_timezone(list(sandbox_data), target_tz)
        total_mail = convert_month_to_timezone(list(total_mail), target_tz)
        CDR_Completed = convert_month_to_timezone(list(CDR_Completed), target_tz)
        impacted_found = convert_month_to_timezone(list(impacted_found), target_tz)
        def add_counts(data):
            """
            Computes the total count and formats data for chart representation.

            Args:
                - data (list): List of dictionaries with 'month' and 'count'.

            Returns:
                - A dictionary containing the total count and formatted chart data.
            """
            total_count = sum(entry['count'] for entry in data)
            chart_data = [{"month": entry['month'], "count": entry['count']} for entry in data]
            return {"total_count": total_count, "chart_data": chart_data}
        combined_data = {
            "2024": {
                "sandbox_data": add_counts(sandbox_data),
                "total_mail": add_counts(total_mail),
                "CDR_Completed": add_counts(CDR_Completed),
                "impacted_found": add_counts(impacted_found),
            }
        }
        return Response(combined_data)
def generate_otp():
    """
    Generates a 6-digit OTP.

    Returns:
        - A string containing a randomly generated 6-digit OTP.
    """
    return str(random.randint(100000, 999999))
class ForgotPasswordView(APIView):
    """
       API View to handle forgot password functionality by sending an OTP to the user's email.

       Endpoint:
           - POST /forgot-password/

       Request Body:
           - email (str): The email address of the user requesting the password reset.

       Workflow:
           1. Extract the email from the request body.
           2. Check if a user with the provided email exists.
           3. If the user exists:
               - Generate a 6-digit OTP using the `generate_otp` function.
               - Save the OTP in the database by creating an `OTP` object linked to the user.
               - Send the OTP to the user's email using Django's `send_mail` function.
           4. Return a success message indicating that the OTP has been sent.
           5. If the user does not exist, return a 404 error response.

       Returns:
           - 200 OK: If the OTP is successfully sent to the user's email.
           - 404 Not Found: If no user exists with the provided email.

       Example Response:
           - Success:
               {
                   "message": "OTP sent to email."
               }
           - Error:
               {
                   "error": "User with this email does not exist."
               }
       """
    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=status.HTTP_404_NOT_FOUND)
        otp = generate_otp()
        OTP.objects.create(user=user, otp=otp)
        send_mail(
            'Your OTP Code',
            f'Your OTP code is {otp}',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        return Response({"message": "OTP sent to email."}, status=status.HTTP_200_OK)
class VerifyOTP(APIView):
    def post(self, request):
        """
            API View to verify the OTP sent to the user's email during the forgot password process.

            Endpoint:
                - POST /verify-otp/

            Request Body:
                - email (str): The email address of the user.
                - otp (str): The OTP code sent to the user's email.

            Workflow:
                1. Extract the email and OTP from the request body.
                2. Validate if the email belongs to an existing user.
                3. Check if an OTP record exists for the given user and matches the provided OTP.
                    - If the email or OTP is invalid, return a 400 error response.
                4. Verify if the OTP has expired by calling the `is_valid` method of the OTP model.
                    - If the OTP is expired, return a 400 error response.
                5. If the OTP is valid:
                    - Mark the OTP record as verified by setting the `verified` field to `True`.
                    - Save the updated OTP record.
                    - Return a success message indicating the OTP was verified successfully.

            Returns:
                - 200 OK: If the OTP is successfully verified.
                - 400 Bad Request: If the email or OTP is invalid, or if the OTP has expired.

            Example Response:
                - Success:
                    {
                        "message": "OTP verified successfully."
                    }
                - Error (Invalid Email or OTP):
                    {
                        "error": "Invalid email or OTP."
                    }
                - Error (Expired OTP):
                    {
                        "error": "OTP has expired."
                    }
            """
        email = request.data.get('email')
        otp = request.data.get('otp')
        try:
            user = User.objects.get(email=email)
            otp_record = OTP.objects.filter(user=user, otp=otp).latest('created_at')
        except (User.DoesNotExist, OTP.DoesNotExist):
            return Response({"error": "Invalid email or OTP."}, status=status.HTTP_400_BAD_REQUEST)
        if not otp_record.is_valid():
            return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)
        otp_record.verified = True
        otp_record.save()
        return Response({"message": "OTP verified successfully."}, status=status.HTTP_200_OK)
class ResetPassword(APIView):
    """
     API View to reset the user's password after OTP verification.

     Endpoint:
         - POST /reset-password/

     Request Body:
         - email (str): The email address of the user.
         - new_password (str): The new password to be set for the user.

     Workflow:
         1. Extract the email and new password from the request body.
         2. Validate the email by checking if a user with the given email exists.
         3. Ensure that an OTP record exists for the user and has been marked as verified.
             - If the email or OTP is invalid, return a 400 error response.
         4. Retrieve the user's recent three passwords from the `PasswordHistory` table.
             - Check if the new password matches any of the last three passwords.
             - If it matches, return a 400 error response indicating the new password must be unique.
         5. If the new password is valid:
             - Hash the new password and update the user's password in the database.
             - Delete the verified OTP record after the password reset.
             - Add the new password to the `PasswordHistory` table.
             - If more than three passwords exist in the history, delete the oldest record.
         6. Return a success message indicating the password was reset successfully.

     Returns:
         - 200 OK: If the password is successfully reset.
         - 400 Bad Request: If the OTP is not verified, the email is invalid, or the new password matches a recent password.

     Example Response:
         - Success:
             {
                 "message": "Password reset successfully."
             }
         - Error (OTP not verified):
             {
                 "error": "OTP has not been verified."
             }
         - Error (Password not unique):
             {
                 "error": "This should be unique from your previous three passwords!"
             }

     Notes:
         - The `PasswordHistory` model is used to track and enforce password uniqueness for the last three passwords.
         - The `check_password` function is used to verify if the new password matches previous passwords.
     """
    def post(self, request):
        email = request.data.get('email')
        new_password = request.data.get('new_password')
        try:
            user = User.objects.get(email=email)
            otp_record = OTP.objects.filter(user=user, verified=True).latest('created_at')
        except (User.DoesNotExist, OTP.DoesNotExist):
            return Response({"error": "OTP has not been verified."}, status=status.HTTP_400_BAD_REQUEST)
        recent_passwords = PasswordHistory.objects.filter(user=user).order_by('-created_at')[:3]
        for record in recent_passwords:
            if check_password(new_password, record.hashed_password):
                return Response(
                    {"error": "This should be unique from your previous three passwords!"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        user.password = make_password(new_password)
        user.save()
        otp_record.delete()
        PasswordHistory.objects.create(user=user, hashed_password=user.password)
        if recent_passwords.count() >= 3:
            oldest_password = recent_passwords.last()
            oldest_password.delete()
        return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)


class DisputeRaiseDataView(APIView):
    pagination_class = ApiListPagination

    def get(self, request, *args, **kwargs):
        try:
            # Fetch disputes with unique msg_id and recievers_email, order by latest dispute
            disputes = (
                DisputeInfo.objects
                .select_related('dispute__emaildetails')  # Select related emaildetails
                .values(
                    'dispute__emaildetails__msg_id',  # Unique identifier for messages
                    'dispute__emaildetails__recievers_email',  # Email of receiver
                    'dispute__emaildetails__senders_email',  # Include sender's email
                    'dispute__emaildetails__subject',  # Include subject
                    'dispute__emaildetails__status',  # Include status
                )
                .annotate(
                    max_counter=Max('counter'),  # Get the max counter
                    latest_dispute_id=Subquery(  # Get the latest dispute_id
                        DisputeInfo.objects.filter(
                            dispute__emaildetails__msg_id=OuterRef('dispute__emaildetails__msg_id'),
                            dispute__emaildetails__recievers_email=OuterRef('dispute__emaildetails__recievers_email')
                        ).order_by('-created_at')
                        .values('dispute_id')[:1]
                    )
                )
                .order_by('-latest_dispute_id')  # Order by the latest dispute_id to get the most recent first
            )

            if not disputes:  # If no disputes are found
                return Response(
                    {
                        "message": "Data not available",
                        "data": []
                    },
                    status=status.HTTP_200_OK
                )

            # Pagination setup
            paginator = self.pagination_class()
            paginated_disputes = paginator.paginate_queryset(disputes, request)

            # Serialize the paginated data
            serializer = DisputeraiseSerializer(paginated_disputes, many=True)
            return paginator.get_paginated_response(serializer.data)

        except Exception as e:
            return Response(
                {"error": "An unexpected error occurred.", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class EmailDetailsView(APIView):
    """
    API to fetch email details and related attachment data by msg_id and receivers_email.
    Both parameters are mandatory.
    """

    def get(self, request):
        msg_id = request.GET.get("msg_id")
        receivers_email = request.GET.get("recievers_email")

        if not msg_id or not receivers_email:
            return Response({"error": "Both msg_id and receivers_email are required."}, status=400)

        try:
            email_detail = EmailDetails.objects.get(msg_id=msg_id, recievers_email=receivers_email)
            attachments = Attachment.objects.filter(email_detail=email_detail)
            data = {
                "receivers_email": email_detail.recievers_email,
                "senders_email": email_detail.senders_email,
                "subject": email_detail.subject,
                "eml_file_name": email_detail.eml_file_name,
                "urls": email_detail.urls,
                "attachments": [
                    {
                        "file_name": attachment.attachment.name,
                        "ai_status": attachment.get_ai_status_display() if attachment.ai_status else "N/A",
                        "ai_remarks": attachment.ai_Remarks or "No remarks",
                    }
                    for attachment in attachments
                ],
                "email_body": email_detail.email_body,
            }

            return Response(data, status=200)

        except EmailDetails.DoesNotExist:
            # Return 200 with a "data not available" message
            return Response(
                {
                    "message": "Data not available",
                    "data": None
                },
                status=200
            )

class DashboardDataView(APIView):
    permission_classes = [IsAuthenticated]  # Set to [] or other permission if necessary

    def get(self, request):
        current_year = now().year
        data = {"year": current_year}
        serializer = DashboardSerializer(data)
        return Response(serializer.data)
