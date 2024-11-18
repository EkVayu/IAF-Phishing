from rest_framework import serializers
from .models import *
# from plugin.models import *
from django.contrib.auth import get_user_model
from django.utils import timezone
from plugin.models import EmailDetails, DisputeInfo, Dispute, Attachment
from .models import RoughURL, RoughDomain, RoughMail


User = get_user_model()
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    def to_representation(self, instance):        # The 'instance' is the user object
        ret = super().to_representation(instance)
        ret['id'] = instance.id
        ret['username'] = instance.username  # Add 'id' from the user instance
        ret.pop('password', None,)  # Remove the password from the representation
        return ret


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id','email','password','first_name','last_name','username','is_staff')
        extra_kwargs = { 'password': {'write_only':True}}
   
    def create(self, validated_data):
        validated_data['is_staff'] = True
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
        fields = ['plugin_id', 'license_id', 'browser', 'ip_add', 'install_date', 'create_timestamp',
                  'last_updated_timestamp']


class LicenseSerializer(serializers.ModelSerializer):
    plugins = PluginIdSerializer(many=True, read_only=True)

    class Meta:
        model = License
        #nidhi
        fields = ['license_id', 'organisation', 'valid_from', 'valid_till', 'allocated_to', 'status','is_reserved', 'plugins']
        extra_kwargs = {
            'allocated_to': {'required': False, 'allow_null': True}
        }
#nidhi

    def validate_allocated_to(self, value):
        if self.instance and self.instance.status == '0':
            raise serializers.ValidationError("Inactive licenses cannot be allocated.")
        return value

class PluginMasterSerializer(serializers.ModelSerializer):
    class Meta:
        model = PluginMaster
        fields = '__all__'


# UserProfile
#Soumya Ranjan(25-10-24)
class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)

    class Meta:
        model = UserProfile
        fields = ['phone_number', 'address', 'organization', 'first_name', 'last_name', 'full_name', 'email']
        extra_kwargs = {
            'phone_number': {'required': False},
            'address': {'required': False},
            'organization': {'required': False},
        }

    def update(self, instance, validated_data):
        # Extract nested user data if available
        user_data = validated_data.pop('user', {})

        # Update first_name and last_name if provided
        if 'first_name' in user_data:
            instance.user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            instance.user.last_name = user_data['last_name']
        instance.user.save()  # Save changes to User model

        # Update UserProfile fields
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.address = validated_data.get('address', instance.address)
        instance.organization = validated_data.get('organization', instance.organization)

        instance.save()  # Save changes to UserProfile
        return instance

class LicenseAllocationSerializer(serializers.ModelSerializer):
    plugin = PluginMasterSerializer(read_only=True)

    # license = LicenseSerializer(read_only=True)
    class Meta:
        model = LicenseAllocation
        fields = ['license', 'plugin', 'allocated_to', 'allocation_date', 'revoke_date']


class EmailDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailDetails
        fields = '__all__'


class DisputeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DisputeInfo
        fields = '__all__'


class CombinedEmailDisputeSerializer(serializers.Serializer):
    email_details = EmailDetailsSerializer(many=True)
    dispute_info = DisputeInfoSerializer(many=True)

    def to_representation(self, instance):
        # Customize how you combine data from EmailDetails and DisputeInfo
        email_data = EmailDetailsSerializer(instance['email_details'], many=True).data
        dispute_data = DisputeInfoSerializer(instance['dispute_info'], many=True).data

        # Combine both data as you want
        return {
            'email_details': email_data,
            'dispute_info': dispute_data,
        }


class EmailDetailsUpdateSerializer(serializers.Serializer):
    recievers_email = serializers.EmailField(required=True)
    message_id = serializers.CharField(required=True)
    status = serializers.CharField(required=True)
    admin_comment = serializers.CharField(required=False, allow_blank=True)  # Make this field optional

    def update(self, validated_data):
        # Update EmailDetails model
        try:
            email_detail = EmailDetails.objects.get(
                recievers_email=validated_data['recievers_email'],
                message_id=validated_data['message_id']
            )
            email_detail.status = validated_data['status']
            email_detail.save()

            # If admin_comment is provided, update related DisputeInfo model if it exists
            admin_comment = validated_data.get('admin_comment', None)
            if admin_comment is not None:
                dispute_info = DisputeInfo.objects.filter(dispute__msg_id=email_detail.message_id).first()
                if dispute_info:
                    dispute_info.admin_comment = admin_comment
                    dispute_info.save()

            return email_detail
        except EmailDetails.DoesNotExist:
            raise serializers.ValidationError("No EmailDetails found with the provided recievers_email and message_id.")
        

#nidhi
class RoughURLSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoughURL
        fields = ['id', 'url', 'protocol']


class RoughDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoughDomain
        fields = ['id', 'ip', 'prototype']


class RoughMailSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoughMail
        fields = ['id', 'mailid']


class MachineDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = MachineData
        fields = [
            'machine_id',
            'system',
            'machine',
            'processor',
            'platform_version',
            'serial_number',
            'uuid',
            'mac_addresses',
        ]

class DisputeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dispute
        fields = ['status']


class DisputeSerializer(serializers.ModelSerializer):
    """
    Serializer for Dispute model that updates the `status` and corresponding `EmailDetails` records
    with matching `msg_id` and `email`.
    """

    class Meta:
        model = Dispute
        fields = ['id', 'status', 'updated_at']
        read_only_fields = ['updated_at']

    def update(self, instance, validated_data):
        # Get the new status from validated data
        new_status = validated_data.get('status', instance.status)
        if instance.status != new_status:
            # Update the status and timestamp of the Dispute
            instance.status = new_status
            instance.updated_at = timezone.now()
            instance.save()
            matching_emails = EmailDetails.objects.filter(
                msg_id=instance.msg_id,
                recievers_email=instance.email
            )
            for email_detail in matching_emails:
                if new_status == 1:
                    email_detail.status = "safe"
                elif new_status == 2:
                    email_detail.status = "unsafe"

                email_detail.save()
                email_detail.refresh_from_db()

        return instance


class DisputeCommentSerializer(serializers.ModelSerializer):
    dispute = serializers.PrimaryKeyRelatedField(queryset=Dispute.objects.all())

    class Meta:
        model = DisputeInfo
        fields = ['dispute', 'admin_comment']

    def validate(self, data):
        dispute = data.get('dispute')
        if not dispute.msg_id:
            raise serializers.ValidationError({
                "dispute": "The selected dispute does not have a valid msg_id."
            })
        emaildetails = EmailDetails.objects.filter(msg_id=dispute.msg_id).first()
        if not emaildetails:
            raise serializers.ValidationError({
                "dispute": "No EmailDetails found for the provided dispute's msg_id."
            })
        data['emaildetails'] = emaildetails
        return data

    def create(self, validated_data):
        admin_comment = validated_data.get('admin_comment')
        if not admin_comment:
            raise serializers.ValidationError({
                "admin_comment": "This field is required."
            })

        emaildetails = validated_data.pop('emaildetails')
        dispute_info = DisputeInfo.objects.create(emaildetails=emaildetails, **validated_data)
        return dispute_info



class AttachmentSerializer(serializers.ModelSerializer):
    msg_id = serializers.SerializerMethodField()
    ai_status = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ['msg_id', 'ai_status', 'created_at', 'ai_sended_at', 'attachment']

    def get_msg_id(self, obj):
        return obj.email_detail.msg_id

    def get_ai_status(self, obj):
        # Map integer values to descriptive names
        status_map = {
            1: "Safe",
            2: "Unsafe",
            3: "Exception",
            4: "Failed"
        }
        return status_map.get(obj.ai_status, "Unknown")

class MonthlyDataSerializer(serializers.Serializer):
    month = serializers.CharField()
    count = serializers.IntegerField()

class CombinedCountSerializer(serializers.Serializer):
    sandbox_data = MonthlyDataSerializer(many=True)
    total_mail = MonthlyDataSerializer(many=True)
    CDR_Completed = MonthlyDataSerializer(many=True)
    impacted_found = MonthlyDataSerializer(many=True)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'username', 'is_deleted']


class DisputeUpdateSerializer(serializers.Serializer):
    msg_id = serializers.CharField(required=True)
    status = serializers.CharField(required=False, allow_blank=True)
    admin_comment = serializers.CharField(required=False, allow_blank=True)

    def update(self, validated_data):
        try:
            # Find EmailDetails based on msg_id
            email_detail = EmailDetails.objects.get(msg_id=validated_data['msg_id'])

            # Update the status if provided
            if 'status' in validated_data:
                email_detail.status = validated_data['status']
                email_detail.save()

            # Update admin_comment in related DisputeInfo if provided
            admin_comment = ""
            if 'admin_comment' in validated_data:
                dispute_info = DisputeInfo.objects.filter(dispute__msg_id=email_detail.msg_id).first()
                if dispute_info:
                    dispute_info.admin_comment = validated_data['admin_comment']
                    dispute_info.save()
                    admin_comment = dispute_info.admin_comment

            return email_detail, admin_comment
        except EmailDetails.DoesNotExist:
            raise serializers.ValidationError("No EmailDetails found with the provided msg_id.")


class DisputeraiseSerializer(serializers.ModelSerializer):
    """
    Serializer for the DisputeInfo model with only the required fields,
    including specific EmailDetails fields directly in the response.
    """
    recievers_email = serializers.CharField(source='emaildetails.recievers_email')
    senders_email = serializers.CharField(source='emaildetails.senders_email')
    subject = serializers.CharField(source='emaildetails.subject')
    status = serializers.CharField(source='emaildetails.status')

    class Meta:
        model = DisputeInfo
        fields = ['id','counter', 'created_at', 'updated_at', 'recievers_email', 'senders_email', 'subject', 'status', 'user_comment', 'admin_comment']



class DisputeISerializer(serializers.ModelSerializer):
    emaildetails_id = serializers.PrimaryKeyRelatedField(queryset=EmailDetails.objects.all(), source='emaildetails')

    class Meta:
        model = DisputeInfo
        fields = ['id', 'dispute', 'user_comment', 'counter', 'emaildetails_id']


class DisputeUpdateInfoSerializer(serializers.Serializer):
    msg_id = serializers.CharField(required=True)
    

    def fetch(self, validated_data):
        try:
            # Find EmailDetails using msg_id
            email_detail = EmailDetails.objects.get(msg_id=validated_data['msg_id'])

            # Retrieve the admin_comment from DisputeInfo
            admin_comment = ""
            dispute_info = DisputeInfo.objects.filter(dispute__msg_id=email_detail.msg_id).first()

            if dispute_info:
                admin_comment = dispute_info.admin_comment

            # Return both email_detail and admin_comment
            return email_detail, admin_comment

        except EmailDetails.DoesNotExist:
            raise serializers.ValidationError("No EmailDetails found with the provided msg_id.")