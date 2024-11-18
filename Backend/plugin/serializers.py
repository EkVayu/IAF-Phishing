from rest_framework import serializers
from .models import *
from users.models import PluginMaster, License



class DisputeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = [
            'id',
            'msg_id',
            'email',
            'counter',
            'status',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']


class DisputeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisputeInfo
        fields = [
            'id',
            'dispute',
            'user_comment',
            'admin_comment',
            'counter',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'is_active'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']    
    
class PluginInstallUninstallSerializer(serializers.ModelSerializer):
    class Meta:
        model = PluginInstallUninstall
        fields = ['plugin_id',  'ip_address', 'installed_at', 'uninstalled_at']


class PluginEnableDisableSerializer(serializers.ModelSerializer):
    class Meta:
        model = PluginEnableDisable
        fields = ['plugin_install_uninstall', 'enabled_at', 'disabled_at']
        
        
        
class LicenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = License
        fields = ['license_id', 'organisation', 'allocated_to', 'status', 'valid_from', 'valid_till']

class PluginSerializer(serializers.ModelSerializer):
    license_id = LicenseSerializer()

    class Meta:
        model = PluginMaster
        fields = ['plugin_id', 'license_id', 'browser', 'ip_add', 'install_date', 'create_timestamp']



class AttachmentUpdateSerializer(serializers.Serializer):
    msg_id = serializers.CharField(required=True)
    attachments = serializers.FileField(required=True)


class TotalCountSerializer(serializers.Serializer):
    dispute=serializers.IntegerField()
    EmaiDetails=serializers.IntegerField()
        