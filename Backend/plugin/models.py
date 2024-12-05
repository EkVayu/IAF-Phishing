from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.conf import settings
import django.utils.timezone
from django.utils import timezone
import hashlib
from users.models import *
from users.models import UserProfile
from django.contrib.auth import get_user_model
User = get_user_model()


class EmailDetails(models.Model):
    """
    Attributes:
        msg_id (str): The ID of the email message.
        u_id (str): The unique identifier of the email.
        recievers_email (str): The email address of the recipient.
        senders_email (str): The email address of the sender.
        eml_file_name (str): The name of the email file.
        plugin_id (str): The ID of the plugin associated with the email.
        message_id (str): The ID of the message associated with the email.
        status (str): The status of the email.
        subject (str): The subject of the email.
        urls (
        TextField): The URLs associated with the email.
        create_time (datetime): The datetime when the email details were created.
        bcc (str): The BCC (Blind Carbon Copy) recipients of the email.

        cc (str): The CC (Carbon Copy) recipients of the email.
        attachments (str): The attachments associated with the email.
        ipv4 (str): The IPv4 address associated with the email.
        browser (str): The browser used to send the email.
        email_body (str): The body of the email.

        """
    STATUS_CHOICES = [
        ('safe', 'Safe'),
        ('unsafe', 'Unsafe'),
        ('pending', 'Pending')
    ]
    u_id = models.CharField(max_length=90, blank=True, null=True)
    recievers_email = models.EmailField(max_length=200)
    senders_email = models.CharField(max_length=100, blank=True, null=True)
    eml_file_name = models.CharField(max_length=100, blank=True, null=True)
    plugin_id = models.CharField(max_length=80, blank=True, null=True)
    msg_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    subject = models.TextField(blank=True, null=True)
    urls = models.TextField(blank=True, null=True)
    create_time = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    bcc = models.CharField(max_length=100, blank=True, null=True)
    cc = models.CharField(max_length=100, blank=True, null=True)
    attachments = models.TextField(blank=True, null=True)
    ipv4 = models.GenericIPAddressField(null=True, blank=True)
    browser = models.CharField(max_length=255, null=True, blank=True)
    email_body = models.TextField(blank=True, null=True)
    cdr_file = models.FileField(upload_to='cdr_files/', null=True, blank=True)

    class Meta:
        """
        Meta class for the EmailDetails model.
        """
        managed = True
        db_table = 'plugin_email_details'

        def _str_(self):
            return f"Email Details for {self.u_id} - Status: {self.status}"

        """
        Returns a string representation of the email details, showing the email ID.

        """
# Dispute model represents a record of a dispute in the system.
class Dispute(models.Model):
    """
    Dispute model represents a record of a dispute in the system.
    Attributes:
        msg_id (str): An optional message identifier related to the dispute.
        email_id (str): The email associated with the dispute.
        counter (int): A counter to track the number of actions or updates related to the dispute.
        status (int): The current status of the dispute, either 'Safe' (1) or 'Unsafe' (2).
        started_at (datetime): The datetime when the dispute was initiated.
        created_at (datetime): The datetime when the dispute record was created.
        created_by (User): The user who created the dispute information.
        updated_by (User): The user who created the dispute information.
        is_active (bool): Indicates if the dispute information is currently active.
    """
    SAFE = 1
    UNSAFE = 2
    STATUS_CHOICES = [
        (SAFE, 'Safe'),
        (UNSAFE, 'Unsafe'),
    ]
    emaildetails = models.ForeignKey('EmailDetails', on_delete=models.CASCADE, related_name='info',blank=True,null=True)
    msg_id = models.CharField(max_length=256, null=True, blank=True)
    email = models.EmailField()
    counter = models.IntegerField(null=True)
    status = models.IntegerField(choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_disputes')
    updated_by = models.ForeignKey(
        User, 
        null=True,
        on_delete=models.CASCADE, 
        related_name='dispute_infos_updated'
    )
    is_active = models.BooleanField(default=True)


    class Meta:
        db_table = 'dispute'
        

    def _str_(self):
        """
        Returns a string representation of the dispute, showing the associated email
        and the human-readable status.
        """
        return f"{self.email} - {self.get_status_display()}"


# DisputeInfo model stores additional information and comments related to a specific dispute.
class DisputeInfo(models.Model):
    """
    DisputeInfo model stores additional information and comments related to a specific dispute.

    Attributes:
        dispute (ForeignKey): A reference to the related Dispute object.
        created_at (datetime): The datetime when the dispute information was created.
        updated_at (datetime): The datetime when the dispute information was last updated.
        user_comment (str): An optional comment provided by the user regarding the dispute.
        admin_comment (str): An optional comment provided by the admin regarding the dispute.
        counter (int): A counter to track the number of updates or actions on the dispute info.
        created_by (User): The user who created the dispute information.
        updated_by (User): The user who created the dispute information.
        is_active (bool): Indicates if the dispute information is currently active.
    """
    # emaildetails = models.ForeignKey('EmailDetails', on_delete=models.CASCADE, related_name='info')
    dispute = models.ForeignKey(Dispute, on_delete=models.CASCADE, related_name='info')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user_comment = models.TextField(null=True, blank=True)
    admin_comment = models.TextField(null=True, blank=True)
    # counter = models.IntegerField(null=True,blank=True,READ_ONLY = False)
    counter = models.IntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_dispute_infos')
    updated_by = models.ForeignKey(
        User, 
        null=True,
        on_delete=models.CASCADE, 
        related_name='disputes_updated'
    )
    is_active = models.BooleanField(default=True)
    class Meta:
        db_table = 'dispute_info'

    def _str_(self):
        """
        Returns a string representation of the dispute information, showing the
        message ID of the related dispute.
        """
        return f"Info for {self.dispute.msg_id}"

# EmailDetails model stores details related to an email, including its subject, body, and attachments.
class PluginInstallUninstall(models.Model):
    """
    Attributes:
        plugin_id (str): The ID of the plugin.
        ip_address (str): The IP address of the user who installed or uninstalled the plugin.
        browser (str): The browser used by the user.
        installed_at (datetime): The datetime when the plugin was installed.
        uninstalled_at (datetime): The datetime when the plugin was uninstalled.
    """
    plugin_id = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    browser = models.CharField(max_length=30,null=True)
    installed_at = models.DateTimeField(default=timezone.now)
    uninstalled_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'plugin_install_uninstall'

    def _str_(self):
        return f"Plugin {self.plugin_id}"
    """
    PluginInstallUninstall model stores information about installing and uninstalling plugins.
    """


# PluginEnableDisable model stores information about enabling and disabling actions for a plugin.
class PluginEnableDisable(models.Model):
    """
    Attributes:
        plugin_install_uninstall (ForeignKey): A reference to the related PluginInstallUninstall object.
        enabled_at (datetime): The datetime when the plugin was enabled.
        disabled_at (datetime): The datetime when the plugin was disabled.
    """
    plugin_install_uninstall = models.ForeignKey(PluginInstallUninstall, on_delete=models.CASCADE,
                                                 related_name="enable_disable_actions")
    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name="plugin_actions")
    enabled_at = models.DateTimeField(null=True, blank=True)
    disabled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        """
        Returns a string representation of the enable/disable action, showing the plugin ID.
        """
        db_table = 'plugin_enable_disable'

    def _str_(self):
        return f"Enable/Disable Action for {self.plugin_install_uninstall.plugin_id}"

    """
    PluginEnableDisable model stores information about enabling and disabling actions for a plugin.
    """

    # EmailDetails model stores details related to an email, including its subject, body, and attachments.

class CDRFile(models.Model):
    """
    Attributes:
        email_detail (ForeignKey): A reference to the related EmailDetails object.
        cdr_file (FileField): The CDR file associated with the email.
    """
    email_detail = models.ForeignKey(EmailDetails, on_delete=models.CASCADE, related_name='Emails_cdr_files')
    cdr_file = models.FileField(upload_to='cdr_files/', null=True, blank=True)

    class Meta:
        db_table = 'plugin_emails_cdr_files'

    def __str__(self):
        return f"CDR File for message_id {self.email_detail.msg_id}"
    

class Attachment(models.Model):
    """
    Attributes:
        email_detail (ForeignKey): A reference to the related EmailDetails object.
        attachment (FileField): The attachment associated with the email.
    """
    AI_STATUS_CHOICES = (
        (1, 'Safe'),
        (2, 'Unsafe'),
        (3, 'Exception'),
        (4, 'Failed'),
    )
    email_detail = models.ForeignKey(EmailDetails, on_delete=models.CASCADE, related_name='Emailsattachments')
    cdr_file = models.ForeignKey(CDRFile, on_delete=models.SET_NULL, null=True, blank=True, related_name='attachments')
    attachment = models.FileField(upload_to='attachments/', null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)
    sended = models.BooleanField(default=False)
    ai_Remarks = models.TextField(null=True, blank=True)
    ai_status = models.IntegerField(choices=AI_STATUS_CHOICES, null=True, blank=True)
    ai_sended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'plugin_emails_attachments'
        ordering = ['created_at']

    def __str__(self):
        return f"Attachment for message_id {self.email_detail.msg_id}"
    

class URL(models.Model):
        
        """
    # 
        Attributes:
            email_detail (ForeignKey): A reference to the related EmailDetails object.
            url (URLField): The URL associated with the email.
        """
        email_detail = models.ForeignKey(EmailDetails, on_delete=models.CASCADE, related_name='Emaidetialsurls')
        url = models.URLField(max_length=1000, blank=True, null=True)
        class Meta:
            db_table = 'plugin_emails_urls'

        def __str__(self):
             return f"URL for message_id {self.email_detail.msg_id}"


class UserSystemDetails(models.Model):
    """
    Attributes:
        uuid (CharField): The UUID of the device.
        mac_address (CharField): The MAC address of the device.
        serial_number (CharField): The serial number of the device.
        os_type (CharField): The type of operating system.
        os_platform (CharField): The platform of the operating system.
        os_release (CharField): The release version of the operating system.
        host_name (CharField): The host name of the device.
        architeecture (CharField): The architecture of the device.
        created_at (DateTimeField): The timestamp when the device information was created.

            """
    license_allocation = models.ForeignKey(LicenseAllocation, on_delete=models.CASCADE, related_name='device_information')
    uuid = models.CharField(max_length=100, unique=True)
    mac_address = models.CharField(max_length=100, blank=True, null=True)
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    os_type = models.CharField(max_length=30, blank=True, null=True)
    os_platform = models.CharField(max_length=30, blank=True, null=True)
    os_release = models.CharField(max_length=30, blank=True, null=True)
    host_name = models.CharField(max_length=100, blank=True, null=True)
    architecture = models.CharField(max_length=20, blank=True, null=True)
    registered_at= models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_system_details'
        def __str__(self):
            return f"Device Information for {self.serial_number}"
        

class SystemBrowserDetails(models.Model):
    """
    Attributes:
        device_information (ForeignKey): A reference to the related DeviceInformation object.
        url (URLField): The URL associated with the browser history.
        title (CharField): The title of the browser history.
        created_at (DateTimeField): The timestamp when the browser history was created.

    """
    BROWSER_CHOICES = [
    ('Chrome', 'Chrome'),
    ('Edge', 'Edge'),
    ('Firefox', 'Firefox'),
    ]
    device_information = models.ForeignKey(UserSystemDetails, on_delete=models.CASCADE, related_name='browser_histories')
    ipv4 = models.GenericIPAddressField(null=True, blank=True)
    browser = models.CharField(max_length=100, choices=BROWSER_CHOICES, blank=True, null=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    unregistered_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'system_browser_details'
        def __str__(self):
            return f"Browser History for {self.device_information.serial_number}"
        
def generate_checksum(file):
    sha256 = hashlib.sha256()
    for chunk in file.chunks():
        sha256.update(chunk)
    return sha256.hexdigest()
        
class AgentFile(models.Model):
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='agents/')
    file_type = models.CharField(max_length=50, default="Executable")
    version = models.CharField(max_length=50, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    operating_system = models.CharField(
        max_length=100,
        choices=[('Windows', 'Windows'), ('Linux', 'Linux'), ('MacOS', 'MacOS'), ('Cross-platform', 'Cross-platform'), ('Other', 'Other')],
        default='Windows'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    active_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_disabled = models.BooleanField(default=False)
    size = models.BigIntegerField(null=True, blank=True)
    checksum = models.CharField(max_length=64, null=True, blank=True)
    download_count = models.PositiveIntegerField(default=0)
    expiry_date = models.DateTimeField(null=True, blank=True)
    support_email = models.EmailField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.file:
            if not self.size:
                self.size = self.file.size
            if not self.checksum:
                self.checksum = generate_checksum(self.file)
        if self.expiry_date and self.expiry_date < timezone.now():
            self.is_disabled = True
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'agent_file'
        verbose_name = "Agent File"
        verbose_name_plural = "Agent Files"
        ordering = ['-uploaded_at']

class FunctionLog(models.Model):
    function_name = models.CharField(max_length=255)
    execution_time = models.FloatField()
    status = models.CharField(max_length=50)
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'function_log'
        verbose_name = "Function Log"
        verbose_name_plural = "Function Logs"
        ordering = ['-created_at']
    def __str__(self):
        return f"{self.function_name} - {self.status}"