# urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path,include
from .views import registration_view
from .views import verify_license_id_view
from .views import check_email_view
from .views import spam_email_view
from plugin.views import DisputeViewSet
from plugin.views import PluginInstallUninstallViewSet
from plugin.views import PluginEnableDisableViewSet
from plugin.views import PluginRegistrationCheckViewSet,cdr_resposne_to_ai, url_response_to_ai,content_response_to_ai,spam_email
# from plugin.ai_services import process_url
# from .views import PluginUninstallView
# from .views import PluginDisableView

# from .views import DisputeInfoViewSet



# urlpatterns = [
#     path('verify-license/', verify_license_view, name='verify_license'),
#     path('register-plugin/', register_plugin_view, name='register_plugin'),
#     path('insert-email/', insert_email_view, name='insert_email'),
#     path('check-email/<str:message_id>/', check_email_view, name='check_email'),
#     path('spam-email/<str:email_id>/<str:plugin_id>/', spam_email_view, name='spam_email'),
# ]
# urlpatterns = [
#     path('', include(router.urls)),
# ]



# Initialize the router
router = DefaultRouter()
router.register(r'disputes', DisputeViewSet, basename='dispute')
router.register(r'plugins/install-uninstall', PluginInstallUninstallViewSet, basename='plugin-install-uninstall')
router.register(r'plugins/enable-disable', PluginEnableDisableViewSet, basename='plugin-enable-disable')
router.register(r'plugin-check', PluginRegistrationCheckViewSet, basename='plugin-check')

# Define URL patterns

urlpatterns = [
    path('register-plugin/', registration_view, name='registration'),
    path('verify-license/', verify_license_id_view, name='verify-license'),
    path('check-email/', check_email_view, name='email-checker'),
    path('spam-email/', spam_email, name='spam_email'),

    
    #............................AI Services............................

    # for check ai_serivices url if then will use only not need to use this url
    # path('send-email-details/', send_email_details, name='send-email-details'),
    # 
    path('cdr-response/', cdr_resposne_to_ai, name='cdr-response'),
    path('url-response/', url_response_to_ai, name='url-response'),
    path('content-response/', content_response_to_ai, name='content-response'),
    # # path('process-url/',process_url, name='process-url'),
    # path('process-attachment/', upload_attachment, name='process-attachment'),

    # ...........................End AI Services............................

    # path('plugin/uninstall/', PluginUninstallView , name='plugin-uninstall'),
    # path('plugin/disable/', PluginDisableView , name='plugin-disable'),
    # Include the router URLs
    path('', include(router.urls)),
]