# from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt
# from django.db import transaction
# from plugin.models import *
# import json

# def check_message_id(message_id):
#     return EmailDetails.objects.filter(message_id=message_id).exists()

# def insert_email_data(u_id, to_email, from_email, eml_file_location, plugin_id, message_id, subject):
#     EmailDetails.objects.create(
#         u_id=u_id,
#         recievers_email=to_email,
#         senders_email=from_email,
#         eml_file_name=eml_file_location,
#         plugin_id=plugin_id,
#         message_id=message_id,
#         subject=subject
#     )
# @csrf_exempt
# @transaction.atomic
# def insert_email_query(request):
#     if request.method == 'POST':
#         data = json.loads(request.body)
#         email_info = data['data']
#         message_id = data['messageId']
#         plugin_id = data['pluginId']
#         eml_file_location = data['emlFileLocation']

#         if check_message_id(message_id):
#             email = EmailDetails.objects.get(message_id=message_id)
#             resp = {
#                 "message": "Email Exists",
#                 "STATUS": email.status,
#                 "messageId": email.message_id
#             }
#             return JsonResponse(resp)
#         else:
#             u_id = message_id
#             insert_email_data(
#                 u_id,
#                 email_info['to'],
#                 email_info['from'],
#                 eml_file_location,
#                 plugin_id,
#                 message_id,
#                 email_info['subject']
#             )
           
#             resp = {
#                 "message": "Email Inserted Successfully",
#                 "STATUS": "Pending",
#                 "messageId": message_id
#             }
#             return JsonResponse(resp)

#     return JsonResponse({"error": "Invalid request method"}, status=400)

# def check_data(request):
#     if request.method == 'GET':
#         message_id = request.GET.get('messageId')
#         try:
#             email = EmailDetails.objects.get(message_id=message_id)
#             resp = {
#                 "message": "Email Exists",
#                 "STATUS": email.status,
#                 "messageId": email.message_id,
#                 "Code": 1
#             }
#         except EmailDetails.DoesNotExist:
#             resp = {
#                 "message": "Email Not Exists",
#                 "STATUS": "Not Found",
#                 "messageId": "",
#                 "Code": 0
#             }
#         return JsonResponse(resp)
#     return JsonResponse({"error": "Invalid request method"}, status=400)

