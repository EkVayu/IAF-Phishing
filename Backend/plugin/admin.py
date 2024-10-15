from django.contrib import admin
from .models import *
from plugin.models import *
# Register your models here.


admin.site.register(Dispute)
admin.site.register(DisputeInfo)
admin.site.register(PluginInstallUninstall)
admin.site.register(PluginEnableDisable)
admin.site.register(EmailDetails)