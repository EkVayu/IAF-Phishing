from django.shortcuts import render
from django.contrib.auth.tokens import default_token_generator
from rest_framework import viewsets, permissions,generics,status,mixins
from rest_framework.decorators import action
from .serializers import * 
from .models import * 
from rest_framework.response import Response 
from django.contrib.auth import get_user_model, authenticate
from knox.models import AuthToken
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils import timezone


User = get_user_model()


class LoginViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def create(self, request): 
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid(): 
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            user = authenticate(request, email=email, password=password)
            if user: 
                _, token = AuthToken.objects.create(user)
                return Response(
                    {
                        "user": self.serializer_class(user).data,
                        "token": token
                    }
                )
            else: 
                return Response({"error":"Invalid credentials"}, status=401)    
        else: 
            return Response(serializer.errors,status=400)


class RegisterViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self,request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else: 
            return Response(serializer.errors,status=400)
        
class UserViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def list(self,request):
        queryset = User.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    
    
    

# 
# Changes password
class ChangePasswordViewset(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
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
                return Response({'old_password': ['Wrong password']}, status=status.HTTP_400_BAD_REQUEST)
            # if everything is good then password will saved
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password changed successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
# Password reset request 
class PasswordResetRequestViewset(mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = PasswordResetRequestSerializer
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        # validate the email 
        if serializer.is_valid():
            email = serializer.validated_data['email']  
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({'email': 'User with this email does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_url = f"{request.build_absolute_uri('/reset-password/')}?uid={uid}&token={token}"
            
            message = "Verification Link sent Successfully on your registered email"
            
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

    def list(self,request):
        queryset = License.objects.all()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='by-license/(?P<license_id>[^/.]+)')
    def get_by_license_id(self, request, license_id=None):
        plugins = PluginMaster.objects.filter(license_id__license_id=license_id)
        if plugins.exists():
            serializer = self.get_serializer(plugins, many=True)
            return Response(serializer.data)
        else:
            return Response({"detail": "No plugins found for the provided license_id"}, status=status.HTTP_404_NOT_FOUND)
        
        
        
    
    # /licenses/${licenseId}/allocate/    
    @action(detail=True, methods=['post'])
    def allocate(self, request, pk=None):
        try:
            license = self.get_object()
            allocated_to = request.data.get('allocated_to')
            allocation_date = timezone.now()

            # Update the License instance
            license.allocated_to = allocated_to
            license.status = 1
            license.save()

            # Create a new LicenseAllocation instance
            LicenseAllocation.objects.create(
                license=license,
                allocated_to=allocated_to,
                allocation_date=allocation_date
            )

            return Response({'status': 'License allocated successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Revoke
    @action(detail=False, methods=['post'], url_path='revoke-license/(?P<license_id>[^/.]+)')
    def revoke_license(self, request, license_id=None):
        try:
            license = License.objects.get(license_id=license_id)
            license.status = '0'
            license.allocated_to = None
            license.save()

            license_allocation = LicenseAllocation.objects.filter(license=license).order_by('-allocation_date').first()
            if license_allocation:
                license_allocation.revoke_date = timezone.now()
                license_allocation.save()

            return Response({"detail": "License revoked successfully"}, status=status.HTTP_200_OK)
        except License.DoesNotExist:
            return Response({"detail": "License not found"}, status=status.HTTP_404_NOT_FOUND)      
        
    # @action(detail=False, methods=['get'], url_path='details-with-plugins/(?P<license_id>[^/.]+)')
    # def details_with_plugins(self, request, license_id=None):
    #     try:
    #         license_instance = License.objects.get(license_id=license_id)
    #     except License.DoesNotExist:
    #         return Response({"detail": "License not found"}, status=status.HTTP_404_NOT_FOUND)
        
    #     serializer = self.get_serializer(license_instance)
    #     return Response(serializer.data, status=status.HTTP_200_OK)


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
    
    
class PluginMasterViewSet(viewsets.ModelViewSet):
   # permission_classes = [permissions.IsAuthenticated]

    queryset = PluginMaster.objects.all()
    serializer_class = PluginMasterSerializer
    
    def list(self,request):
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
            return Response({"detail": "No plugins found for the provided license_id"}, status=status.HTTP_404_NOT_FOUND)

    
# class LicenseListView(generics.ListAPIView):
#     queryset = License.objects.all()
#     serializer_class = LicenseSerializer


class LicenseAllocationViewSet(viewsets.ModelViewSet):
    queryset = LicenseAllocation.objects.all()
    serializer_class = LicenseAllocationSerializer