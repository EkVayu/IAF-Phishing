from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from knox.models import AuthToken
from users.models import CustomUser  # Ensure this import is correct


User = get_user_model()

class LoginViewsetTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword',
            first_name='Test',
            last_name='User'
        )
        self.login_url = reverse('login-list')

    def test_login_with_valid_credentials(self):
        data = {
            'email': 'testuser@example.com',
            'password': 'testpassword'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('role', response.data)

    def test_login_with_invalid_credentials(self):
        data = {
            'email': 'testuser@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)


class RegisterViewsetTestCase(APITestCase):
    def setUp(self):
        self.register_url = reverse('register-list')

    def test_register_with_valid_data(self):
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpassword',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'newuser@example.com')

    def test_register_with_invalid_data(self):
        data = {
            'email': 'invaliduser@example.com',
            'password': '',
            'first_name': 'Invalid',
            'last_name': 'User'
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ChangePasswordViewsetTestCase(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='oldpassword',
            first_name='Test',  # Include first_name and last_name if required
            last_name='User'
        )
        
        self.change_password_url = reverse('change-password-list')  # Ensure this URL pattern is correct in urls.py
        self.client.force_authenticate(user=self.user)

    def test_change_password_with_valid_data(self):
        data = {
            'old_password': 'oldpassword',
            'new_password': 'newpassword'
        }
        response = self.client.post(self.change_password_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(self.user.check_password('newpassword'))

    def test_change_password_with_invalid_old_password(self):
        data = {
            'old_password': 'wrongpassword',
            'new_password': 'newpassword'
        }
        response = self.client.post(self.change_password_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('old_password', response.data)

class LicenseListViewTestCase(APITestCase):
    def setUp(self):
        self.license_url = reverse('license-list-list')  # Correct URL pattern
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='password',
            first_name='Test',
            last_name='User'  # Include required fields
        )
        self.client.force_authenticate(user=self.user)

    def test_list_licenses(self):
        response = self.client.get(self.license_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_multiple_licenses(self):
        data = {
            'number_of_licenses': 5,
            'organisation': 'TestOrg',
            'valid_from': '2024-10-06 12:00:00',
            'valid_till': '2025-10-06 12:00:00'
        }
        response = self.client.post(self.license_url, data, format='json')  # Use correct URL
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

