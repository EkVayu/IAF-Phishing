from django.contrib import admin
from django.test import TestCase
from django.urls import reverse
from users.models import CustomUser, License, PluginMaster, UserProfile, Organisations
from users.admin import UserProfileAdmin
from django.contrib.auth import get_user_model



class TestAdminRegistration(TestCase):
    
    def test_custom_user_registered(self):
        """Test if CustomUser model is registered in the admin"""
        self.assertIn(CustomUser, admin.site._registry)

    def test_license_registered(self):
        """Test if License model is registered in the admin"""
        self.assertIn(License, admin.site._registry)

    def test_plugin_master_registered(self):
        """Test if PluginMaster model is registered in the admin"""
        self.assertIn(PluginMaster, admin.site._registry)

    def test_user_profile_registered(self):
        """Test if UserProfile model is registered with the custom admin"""
        self.assertIn(UserProfile, admin.site._registry)
        self.assertIsInstance(admin.site._registry[UserProfile], UserProfileAdmin)

    def test_organisations_registered(self):
        """Test if Organisations model is registered in the admin"""
        self.assertIn(Organisations, admin.site._registry)


class TestUserProfileAdmin(TestCase):
    
    def setUp(self):
        # Create an instance of UserProfileAdmin to test its configuration
        self.user_profile_admin = UserProfileAdmin(UserProfile, admin.site)

    def test_list_display(self):
        """Test if 'list_display' contains correct fields"""
        expected_list_display = ('full_name', 'email', 'phone_number', 'organization')
        self.assertEqual(self.user_profile_admin.list_display, expected_list_display)

    def test_search_fields(self):
        """Test if 'search_fields' contains correct fields"""
        expected_search_fields = ('user_first_name', 'userlast_name', 'user_email', 'organization')
        self.assertEqual(self.user_profile_admin.search_fields, expected_search_fields)
        
    def test_admin_url_reverse(self):
            """Test if UserProfile has a valid change list URL in the admin"""
            url = reverse('admin:users_userprofile_changelist')  # Ensure correct URL name
            response = self.client.get(url)
            if response.status_code == 302:  # If redirected, follow the redirect
                response = self.client.get(response.url)
            self.assertEqual(response.status_code, 200)  # Check if final response is 200

