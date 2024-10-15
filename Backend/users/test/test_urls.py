from django.urls import reverse, resolve
from django.test import SimpleTestCase
from ..views import (
    RegisterViewset,
    LoginViewset,
    UserViewset,
    StaffViewset,
    LicenseListView,
    PluginMasterViewSet,
    ChangePasswordViewset,
    PasswordResetRequestViewset,
    PasswordResetViewset,
    LicenseAllocationViewSet,
    UserProfileView,
    EmailDetailsViewSet,
)

class UrlsTest(SimpleTestCase):

    def test_register_url(self):
        url = reverse('register-list')
        self.assertEqual(resolve(url).func.view_class, RegisterViewset)

    def test_login_url(self):
        url = reverse('login-list')
        self.assertEqual(resolve(url).func.view_class, LoginViewset)

    def test_users_url(self):
        url = reverse('users-list')
        self.assertEqual(resolve(url).func.view_class, UserViewset)

    def test_staff_url(self):
        url = reverse('staff-list')
        self.assertEqual(resolve(url).func.view_class, StaffViewset)

    def test_license_list_url(self):
        url = reverse('license-list')
        self.assertEqual(resolve(url).func.view_class, LicenseListView)

    def test_plugins_url(self):
        url = reverse('pluginmaster-list')  # Adjust if necessary
        self.assertEqual(resolve(url).func.view_class, PluginMasterViewSet)

    def test_change_password_url(self):
        url = reverse('change-password-list')
        self.assertEqual(resolve(url).func.view_class, ChangePasswordViewset)

    def test_password_reset_request_url(self):
        url = reverse('password-reset-request-list')
        self.assertEqual(resolve(url).func.view_class, PasswordResetRequestViewset)

    def test_password_reset_url(self):
        url = reverse('password-reset-list')
        self.assertEqual(resolve(url).func.view_class, PasswordResetViewset)

    def test_license_allocation_url(self):
        url = reverse('allocations-list')
        self.assertEqual(resolve(url).func.view_class, LicenseAllocationViewSet)

    def test_user_profile_url(self):
        url = reverse('profile-list')
        self.assertEqual(resolve(url).func.view_class, UserProfileView)

    def test_email_details_url(self):
        url = reverse('emaildetails-list')
        self.assertEqual(resolve(url).func.view_class, EmailDetailsViewSet)

    def test_partial_update_user_profile_url(self):
        url = reverse('partial-update-by-user-id', kwargs={'user_id': 1})  # Example user_id
        self.assertEqual(resolve(url).func.view_class, UserProfileView)
