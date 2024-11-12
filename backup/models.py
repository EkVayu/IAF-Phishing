from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
import django.utils.timezone
from django.utils import timezone



# Create your models here.


# User Models
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email = email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    email = models.EmailField(max_length=200, unique=True)
    username = models.CharField(max_length=200,null=True,blank=True)
    
    objects = CustomUserManager()
    
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []



# Custom models

# class License(models.Model):
#     license_id = models.CharField(max_length=10,primary_key=True)
#     user_email = models.CharField(max_length=50, null=True)
#     count = models.IntegerField(null=False, default=0)
#     valid_from = models.DateTimeField(null=True)
#     valid_till = models.DateTimeField(null=True)
#     created_timestamp = models.DateTimeField(default=django.utils.timezone.now)
    
#     class Meta:
#         db_table = 'license_masters'
        
        
class License(models.Model):
    license_id = models.CharField(max_length=10,primary_key=True)
    organisation = models.CharField(max_length=5,null=True)
    allocated_to = models.CharField(max_length=150,null=True)
    status = models.CharField(max_length=2,null=True,default=0)
    valid_from = models.DateTimeField(null=True)
    valid_till = models.DateTimeField(null=True)
    created_timestamp = models.DateTimeField(default=django.utils.timezone.now)
    
    class Meta:
        db_table = 'license_masters'
        
    def __str__(self):
        return self.license_id
    
    
class PluginMaster(models.Model):
    plugin_id = models.CharField(max_length=35,primary_key=True)
    email_id = models.CharField(max_length=150,null=True)
    license_id = models.ForeignKey(License, on_delete=models.CASCADE, related_name='plugins')
    browser = models.CharField(max_length=15)
    ip_add = models.GenericIPAddressField()
    install_date = models.DateTimeField(auto_now_add=True)
    create_timestamp = models.DateTimeField(default=django.utils.timezone.now)
    last_updated_timestamp = models.DateTimeField(default=django.utils.timezone.now)

    class Meta:
        db_table = 'plugin_masters'
    
    def __str__(self):
        return str(self.plugin_id)
    
    

class LicenseAllocation(models.Model):
    license = models.ForeignKey(License, on_delete=models.CASCADE)
    allocated_to = models.CharField(max_length=50)
    allocation_date = models.DateTimeField(default=timezone.now)
    revoke_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = (('license', 'allocation_date'),)
        db_table = 'license_allocations'
        
# class PluginMaster(models)    
    
    

# class PluginMaster(models.Model):
#     plugin_id = models.CharField(max_length=50, unique=True,primary_key=True)  # Unique identifier for the plugin
#     license_id = models.ForeignKey('License', on_delete=models.CASCADE)  # License id from class License 
#     browser = models.CharField(max_length=15, null=True)
#     ip_add = models.GenericIPAddressField(null=True)  # IP address field
#     install_date = models.DateTimeField(null=True)
#     create_timestamp = models.DateTimeField(default=django.utils.timezone.now)  # Default to current timestamp
#     last_updated_timestamp = models.DateTimeField(auto_now=True)  # Automatically set to current timestamp on update

#     class Meta:
#         db_table = 'plugin_masters'  # Custom table name
