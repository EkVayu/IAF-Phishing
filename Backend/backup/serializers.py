from rest_framework import serializers
from .models import *
from django.contrib.auth import get_user_model
User = get_user_model()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret.pop('password', None)
        return ret

class RegisterSerializer(serializers.ModelSerializer):
    class Meta: 
        model = User
        fields = ('id','email','password')
        extra_kwargs = { 'password': {'write_only':True}}
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

# password reset request 
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

# Change password
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(max_length=255, write_only=True)
    new_password = serializers.CharField(max_length=255, write_only=True)
    # validate if password greater then and equal to 8 charactor then password will succesfully changed 
    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("New password must be at least 8 characters long.")
        return value

# password reset 
class PasswordResetSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField()


class PluginIdSerializer(serializers.ModelSerializer):
    class Meta:
        model = PluginMaster
        fields = ['plugin_id']
    
        
class LicenseSerializer(serializers.ModelSerializer):
    plugins = PluginIdSerializer(many=True, read_only=True)
    class Meta: 
        model = License
        fields = ['license_id', 'organisation', 'valid_from', 'valid_till','allocated_to','status','plugins']
        
class PluginMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = PluginMaster
        fields = '__all__'


class LicenseAllocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LicenseAllocation
        fields = ['license', 'allocated_to', 'allocation_date']
        
    
        
        
        