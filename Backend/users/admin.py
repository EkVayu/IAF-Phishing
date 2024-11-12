from django.contrib import admin
from .models import *


# Register your models here.

admin.site.register(CustomUser)
admin.site.register(License)
admin.site.register(OTP)
admin.site.register(PluginMaster)
admin.site.register(MachineData)
from django.contrib import admin
from .models import UserProfile

class UserProfileAdmin(admin.ModelAdmin):
    # Display these fields in the admin list view
    list_display = ('full_name', 'email', 'phone_number', 'organization')
    search_fields = ('user_first_name', 'userlast_name', 'user_email', 'organization')

admin.site.register(UserProfile, UserProfileAdmin)
admin.site.register(Organisations)



# RoughMail admin configuration
class RoughMailAdmin(admin.ModelAdmin):
    list_display = ('id', 'mailid')
    search_fields = ('mailid',)

admin.site.register(RoughMail, RoughMailAdmin)

# RoughURL admin configuration
class RoughURLAdmin(admin.ModelAdmin):
    list_display = ('id', 'url', 'protocol')
    search_fields = ('url', 'protocol')

admin.site.register(RoughURL, RoughURLAdmin)

# RoughDomain admin configuration
class RoughDomainAdmin(admin.ModelAdmin):
    list_display = ('id', 'ip', 'prototype')
    search_fields = ('ip', 'prototype')

admin.site.register(RoughDomain, RoughDomainAdmin)