from django.contrib import admin
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import * 

router = DefaultRouter()
router.register('register', RegisterViewset, basename='register')
router.register('login', LoginViewset, basename='login')
router.register('users', UserViewset, basename='users')

# 
router.register(r'licenses',LicenseListView,basename='license-list')
router.register(r'plugins', PluginMasterViewSet)
router.register(r'allocations', LicenseAllocationViewSet)

# password reset and change
router.register(r'change-password', ChangePasswordViewset, basename='change-password')
router.register(r'password-reset-request', PasswordResetRequestViewset, basename='password-reset-request')
router.register(r'password-reset', PasswordResetViewset, basename='password-reset')


# urlpatterns = [
#     path('licenses/', LicenseListView.as_view(), name='license-list'),
# ]
urlpatterns = router.urls