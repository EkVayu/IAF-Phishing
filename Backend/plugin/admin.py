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
@admin.register(AgentFile)
class AgentFileAdmin(admin.ModelAdmin):
    list_display = ('name', 'version', 'operating_system', 'is_active', 'is_disabled', 'download_count', 'expiry_date')
    list_filter = ('operating_system', 'is_active', 'is_disabled')
    search_fields = ('name', 'version', 'description')
    readonly_fields = ('uploaded_at', 'size', 'checksum', 'download_count')
    actions = ['disable_files', 'enable_files']

    @admin.action(description="Disable selected files")
    def disable_files(self, request, queryset):
        queryset.update(is_disabled=True)

    @admin.action(description="Enable selected files")
    def enable_files(self, request, queryset):
        queryset.update(is_disabled=False)

@admin.register(FunctionLog)
class FunctionLogAdmin(admin.ModelAdmin):
    list_display = ('function_name', 'execution_time', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('function_name',)