from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.conf import settings
import django.utils.timezone
from django.utils import timezone
import hashlib
from datetime import timedelta
from django.utils.dateparse import parse_datetime
# User Models
class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifiers
    for authentication instead of usernames.
    attributes:
        email (str): The email address of the user.
        first_name (str): The first name of the user.
        last_name (str): The last name of the user.
        username (str): The username of the user.
        password (str): The password of the user.
        is_active (bool): Indicates if the user account is active.
        is_staff (bool): Indicates if the user has staff privileges.
        is_superuser (bool): Indicates if the user has superuser privileges.
        date_joined (datetime): The date and time when the user account was created.
        last_login (datetime): The date and time when the user last logged in.
        created_at (datetime): The date and time when the user account was created.
        updated_at (datetime): The date and time when the user account was last updated.
        created_by (User): The user who created the user account.
        updated_by (User): The user who last updated the user account.
        is_active (bool): Indicates if the user account is active.
        is_deleted (bool): Indicates if the user
    """
    def create_user(self, email, first_name, last_name, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        if not first_name:
            raise ValueError('First name is required')
        if not last_name:
            raise ValueError('Last name is required')
        if not username:
            raise ValueError('Username is required')
        email = self.normalize_email(email)
        user = self.model(email=email, first_name=first_name, last_name=last_name, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    def create_superuser(self, email, first_name, last_name, username, password=None, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, first_name, last_name, username, password, **extra_fields)
class CustomUser(AbstractUser):
    """
    Custom user model that supports using email instead of username.
    attributes:
        email (str): The email address of the user.
        password (str): The password for the user.
        first_name (str): The first name of the user.
        last_name (str): The last name of the user.
        username (str): The username of the user.
        is_staff (bool): Indicates if the user is a staff member.
        is_active (bool): Indicates if the user account is active.
        date_joined (datetime): The date and time when the user account was created.
    """
    email = models.EmailField(max_length=200, unique=True)
    is_deleted = models.BooleanField(default=False)
    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'username']
    def delete(self, *args, **kwargs):
        """Override delete method to perform a soft delete."""
        self.is_deleted = True
        self.save()
    def restore(self):
        """Method to restore a soft-deleted user."""
        self.is_deleted = False
        self.save()
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
class PasswordHistory(models.Model):
    """
    Model to store a history of hashed passwords for a user.
    Fields:
        - user (ForeignKey): A foreign key linking the password history entry to a specific user in the authentication system.
        - hashed_password (str): The hashed representation of a user's password.
        - created_at (datetime): The timestamp when the password was added to the history. Automatically set on creation.
    Purpose:
        This model is designed to maintain a record of previous passwords for each user.
        It can be used to enforce password policies, such as preventing reuse of old passwords.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    hashed_password = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
class Organisations(models.Model):
    """
    Model representing an organisation.
    attributes:
        organisation (int): The primary key of the organisation.
        organisation_name (str): The name of the organisation.
        organisation_created_at (datetime): The date and time when the organisation was created.
        organsation_created_by (User): The user who created the organisation.
        organisation_updated_at (datetime): The date and time when the organisation was last updated.
        organisation_updated_by (User): The user who last updated the organisation.
        organisation_is_active (bool): Indicates if the organisation is active.
        organisation_is_deleted (bool): Indicates if the organisation is deleted.
    """
    organisation = models.IntegerField(primary_key=True)
    organisation_name = models.CharField(max_length=255)
    organisation_created_at = models.DateTimeField(auto_now_add=True)
    organsation_created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    organisation_updated_at = models.DateTimeField(auto_now=True)
    organisation_updated_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='updated_by')
    organisation_is_active = models.BooleanField(default=True)
    organisation_is_deleted = models.BooleanField(default=False)
    class Meta:
        db_table = 'organisation_masters'
    def __str__(self):
            return self.organisation_name
class License(models.Model):
    """
    Model representing a license.
    attributes:
        license_id (CharField): The unique identifier for the license.
        organisation (CharField): The organisation associated with the license.
        allocated_to (CharField): The user to whom the license is allocated.
        status (CharField): The status of the license.
        valid_from (DateTimeField): The start date of the license validity.
        valid_till (DateTimeField): The end date of the license validity.
        created_timestamp (DateTimeField): The timestamp when the license was created.
        hashed_license_id (CharField): The hashed version of the license ID.
        plugin_id (ForeignKey): The plugin associated with the license.
    """
    license_id = models.CharField(max_length=10, primary_key=True)
    organisation = models.CharField(max_length=5,null=True,default='IAF')
    allocated_to = models.CharField(max_length=150, null=True, blank=True)
    status = models.CharField(max_length=2, null=False, default=0)
    is_reserved = models.IntegerField(blank=True, default=0)
    valid_from = models.DateTimeField(null=True)
    valid_till = models.DateTimeField(null=True)
    created_timestamp = models.DateTimeField(default=django.utils.timezone.now)
    hashed_license_id = models.CharField(max_length=64, editable=False, null=True)
    plugin_id = models.ForeignKey('PluginMaster', on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='licenses')
    class Meta:
        db_table = 'license_masters'
    def save(self, *args, **kwargs):
        self.hashed_license_id = self.generate_hashed_license_id()
        super().save(*args, **kwargs)
    def generate_hashed_license_id(self):
        """
        Generate a hashed value for the license ID.
        attributes:
            self (License): The license instance.
        returns:
            str: The hashed value of the license ID.
        """
        ip_address = '127.0.0.1'
        secret_key = 'EkVayu'
        message = f"{self.license_id}{ip_address}{secret_key}"
        hashed_value = hashlib.sha256(message.encode()).hexdigest()
        return hashed_value
    def __str__(self):
        return self.license_id
class PluginMaster(models.Model):
    """
    Model representing a plugin.
    attributes:
        plugin_id (CharField): The unique identifier for the plugin.
        email_id (CharField): The email associated with the plugin.
        license_id (ForeignKey):
        The license associated with the plugin.
        browser (CharField): The browser used to install the plugin.
        ip_add (GenericIPAddressField): The IP address of the user who installed the plugin.
        install_date (DateTimeField): The date and time when the plugin was installed.
        create
            timestamp (DateTimeField): The timestamp when the plugin was created.
            last_updated_timestamp (DateTimeField): The timestamp when the plugin was last updated.
        """
    plugin_id = models.CharField(max_length=100, primary_key=True)
    # email_id = models.CharField(max_length=150,null=True)
    license_id = models.ForeignKey(License, on_delete=models.CASCADE, related_name='plugins')
    browser = models.CharField(max_length=15)
    ip_add = models.GenericIPAddressField()
    install_date = models.DateTimeField()
    create_timestamp = models.DateTimeField(auto_now_add=True)
    last_updated_timestamp = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'plugin_masters'
    def __str__(self):
        return str(self.plugin_id)
class UserProfile(models.Model):
    """
    Model representing a user profile.
    attributes:
        user (OneToOneField): The associated user.
        phone_number (CharField): The phone number of the user.
        address (TextField): The address of
        the user.
        organization (CharField): The organization of the user.
            """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=10)
    address = models.TextField(max_length=500)
    organization = models.CharField(max_length=255)
    def __str__(self):
        return self.user.email
    @property
    def full_name(self):
        return f"{self.user.first_name} {self.user.last_name}"
    @property
    def email(self):
        return self.user.email
class LicenseAllocation(models.Model):
    """
    Model representing a license allocation.
    attributes:
        license (ForeignKey): The associated license.
        plugin (ForeignKey): The associated plugin.
        allocated_to (CharField):
            The user to whom the license is allocated.
            allocation_date (DateTimeField): The date and time when the license was allocated.
            revoke_date (DateTimeField): The date and time when the license was revoked.
    """
    license = models.ForeignKey(License, on_delete=models.CASCADE)
    plugin = models.ForeignKey(PluginMaster, on_delete=models.CASCADE, null=True)
    allocated_to = models.CharField(max_length=50)
    allocation_date = models.DateTimeField(default=timezone.now)
    revoke_date = models.DateTimeField(null=True, blank=True)
    class Meta:
        unique_together = (('license', 'allocation_date'),)                         
        db_table = 'license_allocations'
class RoughURL(models.Model):
    """
    Model representing a rough URL.
    attributes:
        url (CharField): The URL string.
        protocol (CharField): The protocol used (e.g., HTTP, HTTPS).
    """
    url = models.CharField(max_length=255)
    protocol = models.CharField(max_length=20)
    class Meta:
        db_table = 'rough_url'
    def __str__(self):
        return f"{self.url} ({self.protocol})"
class RoughDomain(models.Model):
    """
    Model representing a rough domain.
    attributes:
        ip (CharField): The IP address of the domain.
        prototype (CharField): The prototype of the domain (e.g., IPv4, IPv6).
    """
    ip = models.CharField(max_length=45)
    prototype = models.CharField(max_length=20)
    class Meta:
        db_table = 'rough_domain'
    def __str__(self):
        return f"{self.ip} ({self.prototype})"
class RoughMail(models.Model):
    """
    Model representing a rough email ID.
    attributes:
        mailid (EmailField): The email ID.
    """
    mailid = models.EmailField()
    class Meta:
        db_table = 'rough_mail'
    def __str__(self):
        return self.mailid
class MachineData(models.Model):
    """
    Model to store detailed hardware and system information for a machine.
    Fields:
        - machine_id (str): A unique identifier for the machine.
        - system (str): The operating system of the machine (e.g., Windows, Linux).
        - machine (str): The machine type or model (e.g., x86_64, ARM).
        - processor (str): Information about the processor (e.g., Intel Core i7).
        - platform_version (str): The version of the platform or operating system.
        - serial_number (str): The machine's serial number (optional, can be null).
        - uuid (str): The universally unique identifier (UUID) of the machine (optional, can be null).
        - mac_addresses (JSON): A JSON field containing one or more MAC addresses associated with the machine.
    Methods:
        - __str__: Returns the `machine_id` as the string representation of the model.
    Purpose:
        This model is designed to store and manage machine-specific data, including hardware and network
        information, to facilitate identification and tracking of machines in a system or application.
    """
    machine_id = models.CharField(max_length=255)
    system = models.CharField(max_length=100)
    machine = models.CharField(max_length=100)
    processor = models.CharField(max_length=255)
    platform_version = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    uuid = models.CharField(max_length=100, blank=True, null=True)
    mac_addresses = models.JSONField()
    def __str__(self):
        return self.machine_id
class OTP(models.Model):
    """
    Model to store One-Time Passwords (OTP) for user verification.
    Fields:
        - user (ForeignKey): A foreign key linking the OTP to a specific user from the authentication system.
        - otp (str): A 6-character string representing the one-time password.
        - created_at (datetime): The timestamp when the OTP was created. Automatically set on creation.
        - verified (bool): A boolean indicating whether the OTP has been verified. Defaults to `False`.
    Methods:
        - is_valid: Checks if the OTP is still valid by comparing the current time with the time it was created.
          The OTP is valid for 10 minutes from its creation.
    Purpose:
        This model is designed to handle OTP generation, storage, and validation for purposes like user verification
        or password reset. Each OTP is linked to a specific user and expires after 10 minutes.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    verified = models.BooleanField(default=False)
    def is_valid(self):
        """
        Determines if the OTP is still valid based on its creation time.

        Returns:
            bool: `True` if the OTP is valid (within 10 minutes of creation), otherwise `False`.
        """
        return timezone.now() < self.created_at + timedelta(minutes=10)