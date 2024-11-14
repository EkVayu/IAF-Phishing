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
from plugin.views import PluginRegistrationCheckViewSet,cdr_resposne_to_ai, url_response_to_ai,content_response_to_ai,spam_email,GetDisputesView,graph_count,get_disputes_raise_data,get_allocation_data,get_counter_count,UpdateEmailDetailsView






# Initialize the router
router = DefaultRouter()
router.register(r'disputes', DisputeViewSet, basename='dispute')
router.register(r'plugins/install-uninstall', PluginInstallUninstallViewSet, basename='plugin-install-uninstall')
router.register(r'plugins/enable-disable', PluginEnableDisableViewSet, basename='plugin-enable-disable')
router.register(r'plugin-check', PluginRegistrationCheckViewSet, basename='plugin-check')
router.register(r'disputes-details', GetDisputesView, basename='disputes-details')

# Define URL patterns
urlpatterns = [
    path('register-plugin/', registration_view, name='registration'),
    path('verify-license/', verify_license_id_view, name='verify-license'),
    path('check-email/', check_email_view, name='email-checker'),
    path('spam-email/', spam_email, name='spam_email'),
    path('graph-count/',graph_count, name='graph-count'),
    path('get-disputes-raise-data/',get_disputes_raise_data, name='get-disputes-raise-data'),
    path('get-allocation-data/',get_allocation_data, name='get-allocation-data'),
    path('get-counter-count/',get_counter_count, name='get-counter-count'),
    path('update-email-details/', UpdateEmailDetailsView.as_view(), name='update-email-details'),


    
    #............................AI Services............................

    
    path('cdr-response/', cdr_resposne_to_ai, name='cdr-response'),
    path('url-response/', url_response_to_ai, name='url-response'),
    path('content-response/', content_response_to_ai, name='content-response'),
    # # path('process-url/',process_url, name='process-url'),
    # path('process-attachment/', upload_attachment, name='process-attachment'),

    # path('plugin/uninstall/', PluginUninstallView , name='plugin-uninstall'),
    # path('plugin/disable/', PluginDisableView , name='plugin-disable'),
    # Include the router URLs
    path('', include(router.urls)),
]