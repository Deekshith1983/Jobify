from rest_framework import serializers
from django.db import models
from .models import (
    User, Job, JobApplication, CompanyProfile, Message, Notification, 
    EmployerActivity, JobSeekerActivity, JobSeekerProfile
)
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate

class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'full_name', 'role', 'profile_picture']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'role',
            'full_name', 'gender', 'phone', 'city', 'state', 'country',
            'profile_picture', 'resume',
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            role=validated_data['role'],
            full_name=validated_data.get('full_name', ''),
            gender=validated_data.get('gender', ''),
            phone=validated_data.get('phone', ''),
            city=validated_data.get('city', ''),
            state=validated_data.get('state', ''),
            country=validated_data.get('country', ''),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user



class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['username'] = user.username
        token['role'] = user.role
        
        return token
    
    def validate(self, attrs):
        # This method is called during authentication
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                # User exists and password is correct
                if not user.is_active:
                    raise serializers.ValidationError('User account is disabled.')
                
                refresh = self.get_token(user)
                data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                }
                return data
            else:
                raise serializers.ValidationError('Invalid username or password.')
        else:
            raise serializers.ValidationError('Must include username and password.')


class JobSerializer(serializers.ModelSerializer):
    application_deadline = serializers.DateField(required=False, allow_null=True)
    job_description_pdf = serializers.FileField(required=False, allow_null=True)
    current_status = serializers.CharField(read_only=True)
    application_count = serializers.IntegerField(source='applications.count', read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'employer', 'title', 'description', 'job_description_pdf',
            'skills_required', 'salary_min', 'salary_max', 'location_city',
            'location_state', 'job_type', 'application_deadline', 'created_at',
            'status', 'views', 'current_status', 'application_count'
        ]
        read_only_fields = ['employer', 'current_status', 'application_count']

class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyProfile
        fields = '__all__'

class JobSeekerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobSeekerProfile
        fields = '__all__'
        read_only_fields = ['user']

class JobApplicationSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(source='user.full_name', read_only=True)
    applicant_email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = JobApplication
        fields = [
            'id', 'job', 'user', 'resume', 'cover_letter', 'portfolio_link',
            'education_level', 'university', 'major', 'gpa',
            'status', 'created_at', 'applicant_name', 'applicant_email'
        ]
        read_only_fields = ['user']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'recipient', 'sender_name', 'recipient_name', 'content', 'timestamp', 'is_read']
        read_only_fields = ['sender', 'timestamp']
    
    def get_sender_name(self, obj):
        return obj.sender.full_name or obj.sender.username
    
    def get_recipient_name(self, obj):
        return obj.recipient.full_name or obj.recipient.username

class ConversationSerializer(serializers.Serializer):
    user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()
    
    def get_user(self, obj):
        # obj is a User instance (the other user in the conversation)
        return {
            'id': obj.id,
            'username': obj.username,
            'full_name': obj.full_name or obj.username,
            'profile_picture': obj.profile_picture.url if obj.profile_picture else None,
            'role': obj.role
        }
    
    def get_last_message(self, obj):
        # Get the last message between current user and this user
        current_user = self.context['request'].user
        last_message = Message.objects.filter(
            (models.Q(sender=current_user) & models.Q(recipient=obj)) | 
            (models.Q(sender=obj) & models.Q(recipient=current_user))
        ).order_by('-timestamp').first()
        
        if last_message:
            return {
                'content': last_message.content,
                'timestamp': last_message.timestamp,
                'is_sender': last_message.sender == current_user
            }
        return None
    
    def get_unread_count(self, obj):
        # Count unread messages from this user to current user
        current_user = self.context['request'].user
        return Message.objects.filter(
            sender=obj,
            recipient=current_user,
            is_read=False
        ).count()
    
    def get_timestamp(self, obj):
        # Get timestamp of the last message for sorting
        current_user = self.context['request'].user
        last_message = Message.objects.filter(
            (models.Q(sender=current_user) & models.Q(recipient=obj)) | 
            (models.Q(sender=obj) & models.Q(recipient=current_user))
        ).order_by('-timestamp').first()
        
        if last_message:
            return last_message.timestamp
        return None

class NotificationSerializer(serializers.ModelSerializer):
    created_at_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'link', 'is_read', 'created_at', 'created_at_formatted']
        read_only_fields = ['user', 'created_at']
    
    def get_created_at_formatted(self, obj):
        # Format the timestamp for display
        return obj.created_at.strftime('%b %d, %Y, %I:%M %p')


class EmployerActivitySerializer(serializers.ModelSerializer):
    timestamp_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployerActivity
        fields = ['id', 'activity_type', 'description', 'timestamp', 'timestamp_formatted']
    
    def get_timestamp_formatted(self, obj):
        return obj.timestamp.strftime('%b %d, %Y at %I:%M %p')

class JobSeekerActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = JobSeekerActivity
        fields = ['activity_type', 'timestamp']

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value

class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({"new_password_confirm": "New passwords must match."})
        return data