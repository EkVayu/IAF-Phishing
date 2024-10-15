from django.test import TestCase
from users.models import License, PluginMaster, LicenseAllocation, CustomUser
from django.utils import timezone

class LicenseAllocationTestCase(TestCase):
    def setUp(self):
        """
        Set up test data for LicenseAllocation tests
        """
        # Create a test user
        self.user = CustomUser.objects.create_user(
            email="testuser@example.com", 
            first_name="Test", 
            last_name="User", 
            username="testuser", 
            password="password"
        )
        
        # Create a test license
        self.license = License.objects.create(
            license_id="LIC123", 
            organisation="ORG", 
            allocated_to=self.user.email,
            valid_from=timezone.now(),
            valid_till=timezone.now() + timezone.timedelta(days=365),
        )

        # Create a test plugin
        self.plugin = PluginMaster.objects.create(
            plugin_id="PLUGIN123",
            license_id=self.license,
            browser="Chrome",
            ip_add="192.168.1.1",
            install_date=timezone.now()
        )

    def test_create_license_allocation(self):
        """
        Test creating a LicenseAllocation with valid data
        """
        allocation = LicenseAllocation.objects.create(
            license=self.license,
            plugin=self.plugin,
            allocated_to=self.user.email,
            allocation_date=timezone.now()
        )
        self.assertEqual(allocation.allocated_to, self.user.email)
        self.assertIsNone(allocation.revoke_date)  # revoke_date should be None initially

    def test_license_allocation_unique_constraint(self):
        """
        Test the uniqueness constraint of (license, allocation_date)
        """
        allocation_date = timezone.now()
        
        # First allocation should succeed
        LicenseAllocation.objects.create(
            license=self.license,
            plugin=self.plugin,
            allocated_to=self.user.email,
            allocation_date=allocation_date
        )
        
        # Trying to create another allocation with the same license and allocation date should raise an IntegrityError
        with self.assertRaises(Exception):
            LicenseAllocation.objects.create(
                license=self.license,
                plugin=self.plugin,
                allocated_to=self.user.email,
                allocation_date=allocation_date
            )

    def test_revoke_license_allocation(self):
        """
        Test revoking a license allocation by setting revoke_date
        """
        allocation = LicenseAllocation.objects.create(
            license=self.license,
            plugin=self.plugin,
            allocated_to=self.user.email,
            allocation_date=timezone.now()
        )
        revoke_date = timezone.now()
        allocation.revoke_date = revoke_date
        allocation.save()

        updated_allocation = LicenseAllocation.objects.get(id=allocation.id)
        self.assertEqual(updated_allocation.revoke_date, revoke_date)

    def test_create_allocation_without_license(self):
        """
        Test that LicenseAllocation cannot be created without a license
        """
        with self.assertRaises(ValueError):
            LicenseAllocation.objects.create(
                plugin=self.plugin,
                allocated_to=self.user.email,
                allocation_date=timezone.now()
            )

    def test_plugin_association(self):
        """
        Test that the LicenseAllocation is correctly associated with the plugin
        """
        allocation = LicenseAllocation.objects.create(
            license=self.license,
            plugin=self.plugin,
            allocated_to=self.user.email,
            allocation_date=timezone.now()
        )
        self.assertEqual(allocation.plugin, self.plugin)
