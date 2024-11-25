from rest_framework import serializers
from .models import *
# from plugin.models import *
from django.contrib.auth import get_user_model
from django.utils import timezone
from plugin.models import EmailDetails, DisputeInfo, Dispute, Attachment
from .models import RoughURL, RoughDomain, RoughMail
from django.db import transaction

User = get_user_model()
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    def to_representation(self, instance):
        """
        Customize the serialized output to include `id` and `username`, while excluding the `password`.

        Args:
            instance: The user instance being serialized.

        Returns:
            dict: Serialized representation of the user.
        """
        ret = super().to_representation(instance)
        ret['id'] = instance.id
        ret['username'] = instance.username
        ret.pop('password', None,)
        return ret
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id','email','password','first_name','last_name','username','is_staff')
        extra_kwargs = { 'password': {'write_only':True}}
    def create(self, validated_data):
        """
        Create a new user instance with validated data.

        Args:
            validated_data (dict): The validated data from the registration request.

        Returns:
            User: The newly created user instance.
        """
        validated_data['is_staff'] = True
        user = User.objects.create_user(**validated_data)
        return user
class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for handling password reset requests.

    Fields:
        - email (EmailField): The email address associated with the user's account.

    Purpose:
        This serializer is used to validate the email address provided by the user
        when requesting a password reset. The email is typically used to send a
        password reset link or OTP.
    """
    email = serializers.EmailField()
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(max_length=255, write_only=True)
    new_password = serializers.CharField(max_length=255, write_only=True)
    def validate_new_password(self, value):
        """
        Validate the new password for specific security criteria.

        Args:
            value (str): The new password provided by the user.

        Returns:
            str: The validated new password.

        Raises:
            serializers.ValidationError: If the new password does not meet the minimum length requirement.
        """
        if len(value) < 8:
            raise serializers.ValidationError("New password must be at least 8 characters long.")
        return value
class PasswordResetSerializer(serializers.Serializer):
    """
    Serializer for handling password reset using a UID and token.

    Fields:
        - uid (CharField): The unique identifier of the user requesting the password reset.
        - token (CharField): The token used to verify the password reset request.
        - new_password (CharField): The new password the user wishes to set.

    Purpose:
        This serializer is used to validate the UID, token, and new password when the user
        submits a request to reset their password using a token-based authentication system.
    """
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField()
class PluginIdSerializer(serializers.ModelSerializer):
    """
    Serializer for the `PluginMaster` model to represent plugin-related data.

    Fields:
        - plugin_id (int): The unique identifier for the plugin.
        - license_id (int): The identifier for the associated license of the plugin.
        - browser (str): The browser associated with the plugin.
        - ip_add (str): The IP address associated with the plugin installation.
        - install_date (DateTimeField): The date and time when the plugin was installed.
        - create_timestamp (DateTimeField): The timestamp when the plugin record was created.
        - last_updated_timestamp (DateTimeField): The timestamp when the plugin record was last updated.

    Meta:
        - model: The `PluginMaster` model.
        - fields: Specifies the fields to include in the serialized output.

    Purpose:
        This serializer is used to convert `PluginMaster` model instances into a format suitable for API responses, including essential plugin metadata.
    """
    class Meta:
        model = PluginMaster
        fields = ['plugin_id', 'license_id', 'browser', 'ip_add', 'install_date', 'create_timestamp',
                  'last_updated_timestamp']
class LicenseSerializer(serializers.ModelSerializer):
    plugins = PluginIdSerializer(many=True, read_only=True)
    class Meta:
        model = License
        fields = ['license_id', 'organisation', 'valid_from', 'valid_till', 'allocated_to', 'status','is_reserved', 'plugins']
        extra_kwargs = {
            'allocated_to': {'required': False, 'allow_null': True}
        }
    def validate_allocated_to(self, value):
        """
        Validate the `allocated_to` field based on the license's status.

        Args:
            value (str or None): The value to assign to `allocated_to`.

        Returns:
            str or None: The validated value for `allocated_to`.

        Raises:
            serializers.ValidationError: If the license is inactive (status '0'), allocation is not allowed.
        """
        if self.instance and self.instance.status == '0':
            raise serializers.ValidationError("Inactive licenses cannot be allocated.")
        return value
class PluginMasterSerializer(serializers.ModelSerializer):
    """
    Serializer for the `PluginMaster` model to represent plugin-related data.

    Fields:
        All fields from the `PluginMaster` model are included in the serialized output, as specified by `fields = '__all__'`.

    Meta:
        - model: The `PluginMaster` model.
        - fields: Specifies that all fields from the model should be included in the serialized output.

    Purpose:
        This serializer is used to convert `PluginMaster` model instances into a format suitable for API responses, representing all available plugin-related attributes.
    """
    class Meta:
        model = PluginMaster
        fields = '__all__'
class UserProfileSerializer(serializers.ModelSerializer):
    """
        Serializer for the `UserProfile` model, providing a representation of user-related profile data.

        Fields:
            - full_name (str): The full name of the user, derived from the `user` model's `get_full_name` method. This is a read-only field.
            - email (EmailField): The email address of the user, sourced from the related `user` model. This is a read-only field.
            - first_name (str): The first name of the user, sourced from the related `user` model. This field is optional and may be updated.
            - last_name (str): The last name of the user, sourced from the related `user` model. This field is optional and may be updated.
            - phone_number (str, optional): The user's phone number. This field is optional.
            - address (str, optional): The user's address. This field is optional.
            - organization (str, optional): The user's organization. This field is optional.

        Meta:
            - model: The `UserProfile` model.
            - fields: Specifies the fields to include in the serialized output.
            - extra_kwargs: Customizes the `phone_number`, `address`, and `organization` fields to be optional.

        Purpose:
            This serializer is used to represent and manage user profile information, including user-specific details such as phone number, address, and organization, as well as the associated user model fields (`first_name`, `last_name`, `email`, and `full_name`).
        """
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
        user_data = validated_data.pop('user', {})
        if 'first_name' in user_data:
            instance.user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            instance.user.last_name = user_data['last_name']
        instance.user.save()
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.address = validated_data.get('address', instance.address)
        instance.organization = validated_data.get('organization', instance.organization)
        instance.save()
        return instance
class LicenseAllocationSerializer(serializers.ModelSerializer):
    """
    Serializer for the `LicenseAllocation` model, representing the allocation of licenses to plugins.

    Fields:
        - license (str): The license associated with the allocation. Typically a reference to the `License` model.
        - plugin (PluginMasterSerializer): The plugin being allocated. This field is read-only and is serialized using the `PluginMasterSerializer`.
        - allocated_to (str): The entity or user to whom the license is allocated.
        - allocation_date (DateTimeField): The date when the license was allocated.
        - revoke_date (DateTimeField, optional): The date when the license allocation was revoked, if applicable.

    Meta:
        - model: The `LicenseAllocation` model.
        - fields: Specifies the fields to include in the serialized output.

    Purpose:
        This serializer is used to represent license allocations, including the associated plugin details and the allocation period (from allocation to potential revocation).
    """
    plugin = PluginMasterSerializer(read_only=True)
    class Meta:
        model = LicenseAllocation
        fields = ['license', 'plugin', 'allocated_to', 'allocation_date', 'revoke_date']
class EmailDetailsSerializer(serializers.ModelSerializer):
    """
    Serializer for the `EmailDetails` model, representing the details of an email sent through the system.

    Fields:
        All fields from the `EmailDetails` model are included in the serialized output, as specified by `fields = '__all__'`.

    Meta:
        - model: The `EmailDetails` model.
        - fields: Specifies that all fields from the model should be included in the serialized output.

    Purpose:
        This serializer is used to convert `EmailDetails` model instances into a format suitable for API responses,
        representing all the essential information about the email, such as sender, recipient, subject, content, and attachments.
    """
    class Meta:
        model = EmailDetails
        fields = '__all__'
class DisputeInfoSerializer(serializers.ModelSerializer):
    """
    Serializer for the `DisputeInfo` model, representing information related to disputes.

    Fields:
        All fields from the `DisputeInfo` model are included in the serialized output, as specified by `fields = '__all__'`.

    Meta:
        - model: The `DisputeInfo` model.
        - fields: Specifies that all fields from the model should be included in the serialized output.

    Purpose:
        This serializer is used to convert `DisputeInfo` model instances into a format suitable for API responses,
        representing all the details related to a dispute, such as the dispute's status, comments, and any relevant metadata.
    """
    class Meta:
        model = DisputeInfo
        fields = '__all__'
class CombinedEmailDisputeSerializer(serializers.Serializer):
    email_details = EmailDetailsSerializer(many=True)
    dispute_info = DisputeInfoSerializer(many=True)
    def to_representation(self, instance):
        """
        Custom method to control how the serialized data is represented.

        Args:
            instance (dict): The instance containing 'email_details' and 'dispute_info' to be serialized.

        Returns:
            dict: A dictionary with the serialized 'email_details' and 'dispute_info' data.
        """
        email_data = EmailDetailsSerializer(instance['email_details'], many=True).data
        dispute_data = DisputeInfoSerializer(instance['dispute_info'], many=True).data
        return {
            'email_details': email_data,
            'dispute_info': dispute_data,
        }
class EmailDetailsUpdateSerializer(serializers.Serializer):
    recievers_email = serializers.EmailField(required=True)
    message_id = serializers.CharField(required=True)
    status = serializers.CharField(required=True)
    admin_comment = serializers.CharField(required=False, allow_blank=True)
    def update(self, validated_data):
        """
        Updates the email status and optionally adds an admin comment to the dispute info.

        Args:
            validated_data (dict): The validated data containing `recievers_email`, `message_id`, `status`, and optionally `admin_comment`.

        Returns:
            EmailDetails: The updated `EmailDetails` instance.

        Raises:
            serializers.ValidationError: If no `EmailDetails` are found matching the provided `recievers_email` and `message_id`.
        """
        try:
            email_detail = EmailDetails.objects.get(
                recievers_email=validated_data['recievers_email'],
                message_id=validated_data['message_id']
            )
            email_detail.status = validated_data['status']
            email_detail.save()
            admin_comment = validated_data.get('admin_comment', None)
            if admin_comment is not None:
                dispute_info = DisputeInfo.objects.filter(dispute__msg_id=email_detail.message_id).first()
                if dispute_info:
                    dispute_info.admin_comment = admin_comment
                    dispute_info.save()
            return email_detail
        except EmailDetails.DoesNotExist:
            raise serializers.ValidationError("No EmailDetails found with the provided recievers_email and message_id.")
class RoughURLSerializer(serializers.ModelSerializer):
    """
    Serializer for the `RoughURL` model, representing the details of a URL and its associated protocol.

    Fields:
        - id (int): The unique identifier of the URL record.
        - url (str): The actual URL value.
        - protocol (str): The protocol used in the URL (e.g., 'http', 'https').

    Meta:
        - model: The `RoughURL` model.
        - fields: Specifies the fields to include in the serialized output.

    Purpose:
        This serializer is used to represent and manage the data of URLs, including the associated protocol.
    """
    class Meta:
        model = RoughURL
        fields = ['id', 'url', 'protocol']
class RoughDomainSerializer(serializers.ModelSerializer):
    """
    Serializer for the `RoughDomain` model, representing the details of a domain and its associated IP address and prototype.

    Fields:
        - id (int): The unique identifier of the domain record.
        - ip (str): The IP address associated with the domain.
        - prototype (str): The prototype or type associated with the domain (e.g., 'primary', 'secondary').

    Meta:
        - model: The `RoughDomain` model.
        - fields: Specifies the fields to include in the serialized output.

    Purpose:
        This serializer is used to represent and manage the data of domains, including their associated IP addresses and prototypes.
    """
    class Meta:
        model = RoughDomain
        fields = ['id', 'ip', 'prototype']
class RoughMailSerializer(serializers.ModelSerializer):
    """
    Serializer for the `RoughMail` model, representing the details of an email identified by its mail ID.

    Fields:
        - id (int): The unique identifier of the email record.
        - mailid (str): The unique identifier associated with the mail.

    Meta:
        - model: The `RoughMail` model.
        - fields: Specifies the fields to include in the serialized output.

    Purpose:
        This serializer is used to represent and manage the data of email records, specifically focusing on the mail ID.
    """
    class Meta:
        model = RoughMail
        fields = ['id', 'mailid']
class MachineDataSerializer(serializers.ModelSerializer):
    """
    Serializer for the `MachineData` model, representing the details of a machine's hardware and system information.

    Fields:
        - machine_id (int): The unique identifier of the machine.
        - system (str): The operating system of the machine.
        - machine (str): The name or type of the machine.
        - processor (str): The processor information of the machine.
        - platform_version (str): The platform version of the machine's operating system.
        - serial_number (str): The serial number of the machine.
        - uuid (str): The universally unique identifier (UUID) of the machine.
        - mac_addresses (list of str): A list of MAC addresses associated with the machine.

    Meta:
        - model: The `MachineData` model.
        - fields: Specifies the fields to include in the serialized output.

    Purpose:
        This serializer is used to represent and manage machine hardware and system data, such as identifiers, processor, platform version, and network interfaces (MAC addresses).
    """
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
    """
    Serializer for updating the status of a `Dispute` model.

    Fields:
        - status (str): The status of the dispute (e.g., 'pending', 'resolved', 'closed').

    Meta:
        - model: The `Dispute` model.
        - fields: Specifies the fields to include in the serialized output.

    Purpose:
        This serializer is used to update the status of a dispute. It is designed to handle the modification of the dispute's status only.
    """
    class Meta:
        model = Dispute
        fields = ['status']
class DisputeSerializer(serializers.ModelSerializer):
    """
    Serializer for Dispute model that updates the `status` and corresponding `EmailDetails` records.
    """
    status = serializers.CharField()

    class Meta:
        model = Dispute
        fields = ['id', 'status', 'updated_at']
        read_only_fields = ['updated_at']

    def validate_status(self, value):
        """
        Validate and convert string status to its corresponding integer value.
        """
        status_map = {v.casefold(): k for k, v in dict(Dispute.STATUS_CHOICES).items()}
        if value.casefold() not in status_map:
            raise serializers.ValidationError(f'"{value}" is not a valid choice.')
        return status_map[value.casefold()]

    def to_representation(self, instance):
        """
        Convert integer status to its string representation in the response.
        """
        representation = super().to_representation(instance)
        status_map = dict(Dispute.STATUS_CHOICES)
        representation['status'] = status_map.get(instance.status, "Unknown")
        representation['dispute_id'] = representation.pop('id')
        return representation

    def update(self, instance, validated_data):
        """
        Updates the status of a dispute and its associated email details.
        """
        new_status = validated_data.get('status', instance.status)
        if instance.status != new_status:
            instance.status = new_status
            instance.updated_at = timezone.now()
            instance.save()
            new_email_status = "safe" if new_status == Dispute.SAFE else "unsafe"
            EmailDetails.objects.filter(
                msg_id=instance.msg_id,
                recievers_email=instance.email
            ).update(status=new_email_status)
            DisputeInfo.objects.filter(dispute=instance).update(updated_at=timezone.now())
        return instance
class DisputeCommentSerializer(serializers.ModelSerializer):
    dispute = serializers.PrimaryKeyRelatedField(queryset=Dispute.objects.all())
    class Meta:
        model = DisputeInfo
        fields = ['dispute', 'admin_comment']
    def validate(self, data):
        """
        Validates the incoming data before creating the `DisputeInfo` instance.

        Ensures that:
            1. The `dispute` has a valid `msg_id`.
            2. There is an existing `EmailDetails` record associated with the `msg_id`.

        Args:
            data (dict): The incoming data that includes `dispute` and `admin_comment`.

        Raises:
            ValidationError: If the dispute does not have a valid `msg_id` or if no matching `EmailDetails` are found.
        """
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
        """
        Creates a new `DisputeInfo` record with the provided `admin_comment` and associated email details.

        Ensures the `admin_comment` field is provided before creating the record.

        Args:
            validated_data (dict): The validated data containing `dispute`, `admin_comment`, and associated `emaildetails`.

        Returns:
            DisputeInfo: The newly created `DisputeInfo` instance.

        Raises:
            ValidationError: If the `admin_comment` field is missing or empty.
        """
        admin_comment = validated_data.get('admin_comment')
        if not admin_comment:
            raise serializers.ValidationError({
                "admin_comment": "This field is required."
            })
        emaildetails = validated_data.pop('emaildetails')
        dispute = validated_data.get('dispute')
        with transaction.atomic():
            dispute_info = DisputeInfo.objects.create(emaildetails=emaildetails, **validated_data)
            dispute.updated_at = timezone.now()
            dispute.save()

            # Update the `updated_at` field for DisputeInfo
            dispute_info.updated_at = timezone.now()
            dispute_info.save()
        return dispute_info
class AttachmentSerializer(serializers.ModelSerializer):
    msg_id = serializers.SerializerMethodField()
    ai_status = serializers.SerializerMethodField()
    class Meta:
        model = Attachment
        fields = ['msg_id', 'ai_status', 'created_at', 'ai_sended_at', 'attachment']
    def get_msg_id(self, obj):
        """
        Retrieves the `msg_id` from the associated `EmailDetails` record.

        Args:
            obj (Attachment): The `Attachment` instance being serialized.

        Returns:
            str: The `msg_id` of the associated email.
        """
        return obj.email_detail.msg_id
    def get_ai_status(self, obj):
        """
        Maps the AI status code to a human-readable string.

        Args:
            obj (Attachment): The `Attachment` instance being serialized.

        Returns:
            str: A string representing the AI status (e.g., "Safe", "Unsafe", "Exception", "Failed").
        """
        status_map = {
            1: "Safe",
            2: "Unsafe",
            3: "Exception",
            4: "Failed"
        }
        return status_map.get(obj.ai_status, "Unknown")
class MonthlyDataSerializer(serializers.Serializer):
    """
    Serializer for representing monthly data with a count of records.

    Fields:
        - month (str): The month for which the data is being represented (e.g., "2024-10").
        - count (int): The count of records or items associated with the given month.

    Purpose:
        This serializer is used to represent data in a monthly format, where each entry consists of a month and
        the corresponding count of records related to that month. It can be used for generating monthly summaries
        or reports.
    """
    month = serializers.CharField()
    count = serializers.IntegerField()
class CombinedCountSerializer(serializers.Serializer):
    """
    Serializer for representing combined data counts across multiple categories.

    Fields:
        - sandbox_data (list of MonthlyData): A list of monthly data representing counts related to the sandbox category.
        - total_mail (list of MonthlyData): A list of monthly data representing the total count of emails.
        - CDR_Completed (list of MonthlyData): A list of monthly data representing the count of completed CDR (Call Data Record) entries.
        - impacted_found (list of MonthlyData): A list of monthly data representing the count of impacted records found.

    Purpose:
        This serializer aggregates multiple sets of monthly data (such as counts of sandbox data, total mails,
        completed CDRs, and impacted records) into a single response. It allows for the representation of
        multiple categories of data along with their monthly counts in a unified format.
    """
    sandbox_data = MonthlyDataSerializer(many=True)
    total_mail = MonthlyDataSerializer(many=True)
    CDR_Completed = MonthlyDataSerializer(many=True)
    impacted_found = MonthlyDataSerializer(many=True)
class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for representing user details.

    Fields:
        - id (int): The unique identifier of the user.
        - first_name (str): The first name of the user.
        - last_name (str): The last name of the user.
        - email (str): The email address of the user.
        - username (str): The username of the user.
        - is_deleted (bool): A flag indicating if the user is marked as deleted.

    Purpose:
        This serializer is used to represent the core details of a user, including personal information such as
        their first name, last name, email, and username, as well as the deletion status. It can be used to
        serialize user information for API responses where basic user data is needed.
    """
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'username', 'is_deleted']
class DisputeUpdateSerializer(serializers.Serializer):
    msg_id = serializers.CharField(required=True)
    status = serializers.CharField(required=False, allow_blank=True)
    admin_comment = serializers.CharField(required=False, allow_blank=True)
    def update(self, validated_data):
        """
        Updates the status of the email and the admin's comment in the `EmailDetails` and `DisputeInfo` models.

        Args:
            validated_data (dict): A dictionary containing the `msg_id`, `status`, and/or `admin_comment` to be updated.

        Returns:
            tuple: The updated `EmailDetails` instance and the updated `admin_comment` from `DisputeInfo`.

        Raises:
            serializers.ValidationError: If no `EmailDetails` is found for the provided `msg_id`.
        """
        try:
            email_detail = EmailDetails.objects.get(msg_id=validated_data['msg_id'])
            if 'status' in validated_data:
                email_detail.status = validated_data['status']
                email_detail.save()
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
    Serializer for the DisputeInfo model with specific EmailDetails fields.
    """
    dispute_id = serializers.IntegerField(source='dispute.id', read_only=True)  # Add Dispute ID
    recievers_email = serializers.CharField(source='dispute.emaildetails.recievers_email', allow_null=True)
    senders_email = serializers.CharField(source='dispute.emaildetails.senders_email', allow_null=True)
    subject = serializers.CharField(source='dispute.emaildetails.subject', allow_null=True)
    status = serializers.CharField(source='dispute.emaildetails.status', allow_null=True)
    msg_id = serializers.CharField(source='dispute.emaildetails.msg_id', allow_null=True)
    class Meta:
        model = DisputeInfo
        fields = [
            'id',
            'dispute_id',
            'counter',
            'created_at',
            'updated_at',
            'recievers_email',
            'senders_email',
            'subject',
            'status',
            'user_comment',
            'admin_comment',
            'msg_id',

        ]

class DisputeISerializer(serializers.ModelSerializer):
    EmailDetails = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = DisputeInfo
        fields = ['id', 'dispute', 'user_comment', 'counter','EmailDetails']

class DisputeUpdateInfoSerializer(serializers.Serializer):
    msg_id = serializers.CharField(required=True)
    def fetch(self, validated_data):
        """
          Fetches the `EmailDetails` and the associated admin comment from `DisputeInfo` based on the provided msg_id.

          Args:
              validated_data (dict): A dictionary containing the `msg_id` to search for.

          Returns:
              tuple: The `EmailDetails` instance and the associated `admin_comment` from `DisputeInfo`.

          Raises:
              serializers.ValidationError: If no `EmailDetails` instance is found for the provided `msg_id`.
          """
        try:
            email_detail = EmailDetails.objects.get(msg_id=validated_data['msg_id'])
            admin_comment = ""
            dispute_info = DisputeInfo.objects.filter(dispute__msg_id=email_detail.msg_id).first()
            if dispute_info:
                admin_comment = dispute_info.admin_comment
                print(email_detail, admin_comment,"--------------------------"),
            return email_detail, admin_comment
    
        except EmailDetails.DoesNotExist:
            raise serializers.ValidationError("No EmailDetails found with the provided msg_id.")
class DisputeWithInfoSerializer(serializers.ModelSerializer):
    # Nested serializer for DisputeInfo
    dispute_info = DisputeInfoSerializer()

    class Meta:
        model = Dispute
        fields = ['email', 'msg_id', 'counter', 'status', 'created_by', 'updated_by', 'emaildetails', 'dispute_info']

    def create(self, validated_data):
        dispute_info_data = validated_data.pop('dispute_info')
        # Create the Dispute
        dispute = Dispute.objects.create(**validated_data)
        
        # Create the DisputeInfo using the nested data
        dispute_info = DisputeInfo.objects.create(dispute=dispute, **dispute_info_data)
        
        return dispute
        