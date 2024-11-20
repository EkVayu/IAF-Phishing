from django.contrib import admin
from .models import *
from plugin.models import *



admin.site.register(Dispute)
admin.site.register(DisputeInfo)
admin.site.register(PluginInstallUninstall)
admin.site.register(PluginEnableDisable)
admin.site.register(EmailDetails)
admin.site.register(Attachment)
admin.site.register(CDRFile)
admin.site.register(UserSystemDetails)
admin.site.register(SystemBrowserDetails)