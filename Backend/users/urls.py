
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('register', RegisterViewset, basename='register')
router.register('login', LoginViewset, basename='login')
router.register('users', UserViewset, basename='users')
router.register('staff', StaffViewset, basename='staff')
router.register(r'licenses',LicenseListView,basename='license-list')
router.register(r'plugins', PluginMasterViewSet)

#nidhi
router.register(r'license-actions', LicenseViewSet, basename='license-actions') 

# password reset and change
router.register(r'change-password', ChangePasswordViewset, basename='change-password')
router.register(r'password-reset-request', PasswordResetRequestViewset, basename='password-reset-request')
router.register(r'password-reset', PasswordResetViewset, basename='password-reset')
# license allocation

router.register(r'allocations', LicenseAllocationViewSet)

# User Profile
router.register(r'profile', UserProfileView, basename='profile')
router.register(r'emaildetails', EmailDetailsViewSet, basename='emaildetails')


# Rough DB
router.register(r'rough-url', RoughURLViewSet, basename='rough-url')
router.register(r'rough-domain', RoughDomainViewSet, basename='rough-domain')
router.register(r'rough-mail', RoughMailViewSet, basename='rough-mail')

license_viewset = LicenseViewSet.as_view({
    'post': 'reserve_license',
})

urlpatterns = [
    path('', include(router.urls)),
    # path('user-profiles/user_id/<int:user_id>/', UserProfileView.as_view({'get': 'get_user_id'}), name='get-user-id'),
    path('user-profiles/user_id/<int:user_id>/', UserProfileView.as_view({'patch': 'update_profile_by_user_id'}),
         name='partial-update-by-user-id'),
    path('licenses/<str:pk>/reserve/', license_viewset, name='reserve_license'),
    path('api/save-machine-info/', save_machine_info, name='save_machine_info'),
    path('disabled-plugins-count/', get_disabled_plugins_count, name='disabled-plugins-count'),
    path('dispute/<int:pk>/update/', DisputeStatusUpdateView.as_view(), name='dispute-update'),
    path('dispute/<int:dispute_id>/comments/', DisputeCommentCreateView.as_view(), name='dispute-comment-create'),
    path('sandbox-data/', AvailableAttachmentsView.as_view(), name='available-attachments'),
    path('sandbox-data/run-test/', PendingAttachmentsView.as_view(), name='pending-attachments'),
    path('quarentine-data/', quarentineAttachmentsView.as_view(), name='pending-attachments'),
    path('dashboard-data/', MonthlyCombinedEmailAndAttachmentCount.as_view(), name='monthly_data'),
    path('api/forget-passwrod/sendotp/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('api/forget-passwrod/verify-otp/', VerifyOTP.as_view(), name='verify-otp'),
    path('api/forget-passwrod/reset-password/', ResetPassword.as_view(), name='reset-password'),
    path('dispute-raise-data/', DisputeRaiseDataView.as_view(), name='dispute-raise-data'),
    path('email-datails/', EmailDetailsView.as_view(), name='email-details'),

]