from django.contrib.auth import get_user_model
from rest_framework import generics, status, filters, serializers
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings
from django.http import FileResponse, Http404
from rest_framework import generics, mixins
from .models import (
    User, Job, JobApplication, CompanyProfile, Message, Notification, 
    EmployerActivity, JobSeekerActivity, JobSeekerProfile
)
from django.db.models import Q
from .serializers import (
    UserSerializer, CustomTokenObtainPairSerializer, JobSerializer, 
    CompanyProfileSerializer, JobApplicationSerializer, MessageSerializer, 
    NotificationSerializer, EmployerActivitySerializer,
    JobSeekerActivitySerializer,
    PasswordResetRequestSerializer, 
    PasswordResetConfirmSerializer,
    ChangePasswordSerializer,
    UserSearchSerializer,
    ConversationSerializer,
    JobSeekerProfileSerializer,
)
from rest_framework.response import Response
from .filters import JobFilter

# Custom permissions for role-based access
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsEmployer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'employer'

class IsJobSeeker(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'job_seeker'

class IsJobOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.employer == request.user

# DRF APIView for registration
class UserRegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens for the new user
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# DRF APIView for profile (retrieve/update)
class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class JobSeekerProfileRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = JobSeekerProfileSerializer
    permission_classes = [IsAuthenticated, IsJobSeeker]

    def get_object(self):
        profile, created = JobSeekerProfile.objects.get_or_create(user=self.request.user)
        return profile

class CompanyProfileRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated, IsEmployer]

    def get_object(self):
        profile, created = CompanyProfile.objects.get_or_create(employer=self.request.user)
        return profile

    def perform_update(self, serializer):
        profile = serializer.save()
        EmployerActivity.objects.create(
            employer=self.request.user,
            activity_type='company_updated',
            description=f"Updated company profile: '{profile.company_name}'"
        )


# DRF APIView for employer-only endpoint example
class ConversationListView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Get IDs of users the current user has messaged or received messages from
        sent_to_ids = Message.objects.filter(sender=user).values_list('recipient_id', flat=True)
        received_from_ids = Message.objects.filter(recipient=user).values_list('sender_id', flat=True)
        
        user_ids = set(list(sent_to_ids) + list(received_from_ids))
        
        # Return User objects for these IDs
        return User.objects.filter(id__in=user_ids)

class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        other_user_id = self.kwargs['user_id']
        user = self.request.user
        # Get all messages between the current user and the other user
        return Message.objects.filter(
            (Q(sender=user, recipient_id=other_user_id)) |
            (Q(sender_id=other_user_id, recipient=user))
        ).order_by('timestamp')

    def list(self, request, *args, **kwargs):
        # Mark messages from the other user as read
        other_user_id = self.kwargs['user_id']
        Message.objects.filter(sender_id=other_user_id, recipient=request.user, is_read=False).update(is_read=True)
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UserSearchView(generics.ListAPIView):
    serializer_class = UserSearchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('search', None)
        if query:
            return User.objects.filter(
                Q(username__icontains=query) |
                Q(full_name__icontains=query) |
                Q(email__icontains=query)
            ).exclude(id=self.request.user.id)
        return User.objects.none()


class EmployerOnlyAPIView(APIView):
    permission_classes = [IsAuthenticated, IsEmployer]
    def get(self, request):
        return Response({'message': 'Hello Employer!'})

# DRF APIView for jobseeker-only endpoint example
class JobSeekerOnlyAPIView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]
    def get(self, request):
        return Response({'message': 'Hello Job Seeker!'})

# DRF APIView for admin-only endpoint example
class AdminOnlyAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    def get(self, request):
        return Response({'message': 'Hello Admin!'})

custom_token_view = TokenObtainPairView.as_view(serializer_class=CustomTokenObtainPairSerializer)

class JobListCreateAPIView(generics.ListCreateAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    filterset_class = JobFilter

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]  # Allow anyone to view jobs
        return [IsAuthenticated(), IsEmployer()]  # Only employers can create jobs

    def perform_create(self, serializer):
        job = serializer.save(employer=self.request.user)
        EmployerActivity.objects.create(
            employer=self.request.user,
            activity_type='job_posted',
            description=f"Posted a new job: '{job.title}'"
        )

class EmployerJobsAPIView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated, IsEmployer]

    def get_queryset(self):
        return Job.objects.filter(employer=self.request.user).order_by('-created_at')


class JobRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsJobOwner()]
        return [IsAuthenticated()]

    def perform_update(self, serializer):
        job = serializer.save()
        EmployerActivity.objects.create(
            employer=self.request.user,
            activity_type='job_edited',
            description=f"Updated job posting: '{job.title}'"
        )

    def perform_destroy(self, instance):
        EmployerActivity.objects.create(
            employer=self.request.user,
            activity_type='job_deleted',
            description=f"Deleted job posting: '{instance.title}'"
        )
        instance.delete()

class JobApplicationListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'job_seeker':
            return JobApplication.objects.filter(user=user).select_related('job')
        elif user.role == 'employer':
            # Employers see applications for their jobs
            return JobApplication.objects.filter(job__employer=user).select_related('job', 'user')
        return JobApplication.objects.none() # Or handle other roles as needed

    def perform_create(self, serializer):
        if self.request.user.role != 'job_seeker':
            raise PermissionDenied("Only job seekers can apply for jobs.")

        job = serializer.validated_data.get('job')
        if job.application_deadline and job.application_deadline < timezone.now().date():
            raise ValidationError("The application deadline for this job has passed.")

        # Check if the user has already applied for this job
        if JobApplication.objects.filter(user=self.request.user, job=job).exists():
            raise ValidationError("You have already applied for this job.")
        
        application = serializer.save(user=self.request.user)

        # Notify the employer about the new application
        employer = application.job.employer
        applicant_name = application.user.full_name
        job_title = application.job.title

        Notification.objects.create(
            user=employer,
            message=f"You have a new application from {applicant_name} for the job '{job_title}'.",
            link=f"/employer/jobs/{application.job.id}/applications"
        )

class JobApplicationListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Job seekers see their own applications
        if self.request.user.role == 'job_seeker':
            return JobApplication.objects.filter(user=self.request.user)
        # Employers see applications to their jobs
        elif self.request.user.role == 'employer':
            return JobApplication.objects.filter(job__employer=self.request.user)
        return JobApplication.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != 'job_seeker':
            raise PermissionDenied('Only job seekers can apply for jobs.')
        serializer.save(user=self.request.user)

class JobApplicationRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated] # Permissions handled in get_object

    def get_object(self):
        application = super().get_object()
        user = self.request.user

        # Allow job seeker to see their own application
        # Allow employer to see applications for their jobs
        if application.user == user or application.job.employer == user:
            return application
        
        raise PermissionDenied("You do not have permission to view this application.")

class DownloadResumeAPIView(APIView):
    permission_classes = [IsAuthenticated, IsEmployer]

    def get(self, request, application_id):
        application = get_object_or_404(JobApplication, id=application_id)

        # Check if the user is the employer for the job associated with the application
        if application.job.employer != request.user:
            raise PermissionDenied("You do not have permission to download this resume.")

        if not application.resume or not application.resume.path:
            raise Http404("Resume file not found.")

        try:
            return FileResponse(application.resume.open('rb'), as_attachment=True, filename=application.resume.name)
        except FileNotFoundError:
            raise Http404("Resume file not found on disk.")


class JobApplicationsForJobAPIView(generics.ListAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated, IsEmployer]

    def get_queryset(self):
        job_id = self.kwargs.get('job_id')
        job = get_object_or_404(Job, id=job_id)

        if job.employer != self.request.user:
            raise PermissionDenied("You do not have permission to view applications for this job.")

        # Track activity
        EmployerActivity.objects.create(
            employer=self.request.user,
            activity_type='application_viewed',
            description=f"Viewed applications for job: '{job.title}'"
        )

        return JobApplication.objects.filter(job=job)

class JobSearchAPIView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Job.objects.all()
        keyword = self.request.query_params.get('keyword')
        title = self.request.query_params.get('title')
        company = self.request.query_params.get('company')
        location = self.request.query_params.get('location')
        job_type = self.request.query_params.get('job_type')
        salary = self.request.query_params.get('salary')
        experience_level = self.request.query_params.get('experience_level')
        posting_date = self.request.query_params.get('posting_date')
        sort_by = self.request.query_params.get('sort_by')

        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) |
                Q(description__icontains=keyword) |
                Q(skills_required__icontains=keyword)
            )
        if title:
            queryset = queryset.filter(title__icontains=title)
        if company:
            queryset = queryset.filter(employer__company_profile__company_name__icontains=company)
        if location:
            queryset = queryset.filter(Q(location_city__icontains=location) | Q(location_state__icontains=location))
        if job_type:
            queryset = queryset.filter(job_type__iexact=job_type)
        if salary:
            queryset = queryset.filter(salary__icontains=salary)
        if experience_level:
            queryset = queryset.filter(skills_required__icontains=experience_level)
        if posting_date:
            queryset = queryset.filter(created_at__date=posting_date)
        if sort_by:
            if sort_by in ['relevance', 'date', 'salary']:
                if sort_by == 'date':
                    queryset = queryset.order_by('-created_at')
                elif sort_by == 'salary':
                    queryset = queryset.order_by('-salary')
                # 'relevance' can be custom, for now just order by views
                elif sort_by == 'relevance':
                    queryset = queryset.order_by('-views')
        return queryset

class ConversationListAPIView(generics.ListAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Find all users that have exchanged messages with the current user
        message_partners = User.objects.filter(
            Q(sent_messages__recipient=user) | Q(received_messages__sender=user)
        ).distinct()
        return message_partners
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class MessageListAPIView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        other_user_id = self.kwargs.get('user_id')
        
        try:
            other_user = User.objects.get(id=other_user_id)
            # Mark messages from other user as read
            Message.objects.filter(sender=other_user, recipient=user, is_read=False).update(is_read=True)
            # Return all messages between these two users
            return Message.objects.filter(
                (Q(sender=user) & Q(recipient=other_user)) | 
                (Q(sender=other_user) & Q(recipient=user))
            ).order_by('timestamp')
        except User.DoesNotExist:
            return Message.objects.none()

class MessageCreateAPIView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        recipient_id = self.request.data.get('recipient')
        try:
            recipient = User.objects.get(id=recipient_id)
            serializer.save(sender=self.request.user, recipient=recipient)
            
            # Create a notification for the recipient
            sender_name = self.request.user.full_name or self.request.user.username
            Notification.objects.create(
                user=recipient,
                message=f"New message from {sender_name}",
                link=f"/messages/{self.request.user.id}"
            )
        except User.DoesNotExist:
            raise serializers.ValidationError("Recipient not found")

class UnreadMessageCountAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        unread_count = Message.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': unread_count})

class NotificationListAPIView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class NotificationMarkReadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'status': 'marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

class NotificationMarkAllReadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

class UnreadNotificationCountAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': unread_count})

class EmployerDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsEmployer]
    def get(self, request):
        user = request.user
        jobs = Job.objects.filter(employer=user)
        applications = JobApplication.objects.filter(job__employer=user)
        recent_activities = EmployerActivity.objects.filter(employer=user)[:5]
        return Response({
            'job_count': jobs.count(),
            'application_count': applications.count(),
            'recent_activities': EmployerActivitySerializer(recent_activities, many=True).data,
        })

class JobSeekerDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsJobSeeker]
    def get(self, request):
        user = request.user
        applications = JobApplication.objects.filter(user=user)
        saved_jobs = []  # Placeholder for saved jobs logic
        activities = JobSeekerActivity.objects.filter(user=user)[:5]
        return Response({
            'application_count': applications.count(),
            'recent_applications': JobApplicationSerializer(applications.order_by('-created_at')[:5], many=True).data,
            'recent_activities': JobSeekerActivitySerializer(activities, many=True).data,
            'saved_jobs': saved_jobs,
        })

class AdminDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    def get(self, request):
        user_count = User.objects.count()
        job_count = Job.objects.count()
        application_count = JobApplication.objects.count()
        flagged_content = []  # Placeholder for moderation logic
        return Response({
            'user_count': user_count,
            'job_count': job_count,
            'application_count': application_count,
            'flagged_content': flagged_content,
        })


class RequestPasswordResetAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            token_generator = PasswordResetTokenGenerator()
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = token_generator.make_token(user)
            reset_link = f"{settings.CLIENT_URL}/reset-password/{uidb64}/{token}/"

            mail_subject = 'Reset your password'
            message = render_to_string('users/password_reset_email.html', {
                'user': user,
                'reset_link': reset_link,
            })
            email = EmailMessage(mail_subject, message, to=[user.email])
            email.send()
            return Response({'message': 'Password reset link sent.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobApplicationRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if not (obj.user == user or (user.role == 'employer' and obj.job.employer == user)):
            raise PermissionDenied("You do not have permission to view this application.")
        return obj

    def perform_update(self, serializer):
        user = self.request.user
        if user.role != 'employer':
            raise PermissionDenied("Only employers can update job applications.")

        application = self.get_object()
        if application.job.employer != user:
            raise PermissionDenied("You can only update applications for your own jobs.")

        # Prevent status change if already rejected
        if application.status == 'rejected':
            raise ValidationError({'status': 'This application has been rejected and its status cannot be changed.'})

        original_status = application.status
        instance = serializer.save()
        new_status = instance.status

        if original_status != new_status:
            Notification.objects.create(
                user=instance.user,
                message=f"The status of your application for '{instance.job.title}' has been updated to {instance.get_status_display()}.",
                link="/job-seeker/applications"
            )


class PasswordResetConfirmAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None

            if user is not None and PasswordResetTokenGenerator().check_token(user, token):
                user.set_password(serializer.validated_data['password'])
                user.save()
                return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = (IsAuthenticated,)

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            if not self.object.check_password(serializer.data.get("old_password")):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response({"status": "success", "message": "Password updated successfully"}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


