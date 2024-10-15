from django.test import TestCase
from users.models import CustomUser, PluginMaster, License, UserProfile, LicenseAllocation
from plugin.models import EmailDetails, DisputeInfo
from users.serializers import (
    LoginSerializer, RegisterSerializer, PasswordResetRequestSerializer, ChangePasswordSerializer,
    UserProfileSerializer, LicenseSerializer, PluginMasterSerializer, EmailDetailsUpdateSerializer
)

class TestLoginSerializer(TestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email='testuser@example.com',
            password='password123',
            username='testuser',
            first_name='Test',
            last_name='User'  # Add these fields based on your model's requirements
        )

    def test_login_serializer_valid(self):
        data = {'email': 'testuser@example.com', 'password': 'password123'}
        serializer = LoginSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['email'], 'testuser@example.com')

    def test_login_serializer_invalid(self):
        data = {'email': 'invaliduser@example.com', 'password': 'wrongpassword'}
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())



class TestRegisterSerializer(TestCase):
    def test_register_serializer(self):
        data = {
            'email': 'newuser@example.com', 'password': 'password123',
            'first_name': 'New', 'last_name': 'User', 'username': 'newuser'
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.email, 'newuser@example.com')


class TestPasswordResetRequestSerializer(TestCase):
    def test_password_reset_request_serializer(self):
        data = {'email': 'testuser@example.com'}
        serializer = PasswordResetRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())


class TestChangePasswordSerializer(TestCase):
    def test_change_password_serializer_valid(self):
        data = {'old_password': 'oldpassword123', 'new_password': 'newpassword123'}
        serializer = ChangePasswordSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_change_password_serializer_invalid(self):
        data = {'old_password': 'oldpassword123', 'new_password': 'short'}
        serializer = ChangePasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())


class TestUserProfileSerializer(TestCase):
    def setUp(self):
        # Adding first_name and last_name to match the required fields
        self.user = CustomUser.objects.create_user(
            email='profileuser@example.com',
            password='password123',
            username='profileuser',
            first_name='Profile',
            last_name='User'  # Add these required fields
        )
        
        self.profile = UserProfile.objects.create(
            user=self.user,
            phone_number='1234567890',
            address='123 Street',
            organization='TestOrg'
        )

    def test_user_profile_serializer(self):
        serializer = UserProfileSerializer(instance=self.profile)
        data = serializer.data
        self.assertEqual(data['full_name'], self.user.get_full_name())
        self.assertEqual(data['email'], self.user.email)


class TestLicenseSerializer(TestCase):
    def setUp(self):
        self.license = License.objects.create(
            license_id='LIC123', organisation='IF', valid_from='2023-01-01', valid_till='2024-01-01', status='active'
        )

    def test_license_serializer(self):
        serializer = LicenseSerializer(instance=self.license)
        data = serializer.data
        self.assertEqual(data['license_id'], 'LIC123')
        self.assertEqual(data['organisation'], 'TestOrg')
        self.assertEqual(data['status'], 'active')


class TestEmailDetailsUpdateSerializer(TestCase):
    def setUp(self):
        self.email_detail = EmailDetails.objects.create(
            recievers_email='receiver@example.com', message_id='MSG123', status='pending'
        )

    def test_email_details_update_serializer_valid(self):
        data = {'recievers_email': 'receiver@example.com', 'message_id': 'MSG123', 'status': 'delivered'}
        serializer = EmailDetailsUpdateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        updated_email_detail = serializer.update(validated_data=data)
        self.assertEqual(updated_email_detail.status, 'delivered')

    def test_email_details_update_serializer_invalid(self):
        data = {'recievers_email': 'invalid@example.com', 'message_id': 'INVALIDMSG', 'status': 'delivered'}
        serializer = EmailDetailsUpdateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
