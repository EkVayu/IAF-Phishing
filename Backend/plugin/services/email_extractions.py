# from django.http import JsonResponse
# from django.views.decorators.csrf import csrf_exempt
# from email.parser import BytesParser
# from email import policy
# from pathlib import Path
# import re

# def check_eml(eml_content,destination_path):
#         try:
#             # Get the uploaded file
#             # uploaded_file = request.FILES.get('file')
#             if eml_content:
#                 # eml_content = uploaded_file.read()  # Read the file content
#                 # destination_path = '/path/to/save/attachments'  # Set your desired destination path
#                 # print("eml content ->>>>",eml_content)

#                 # Extract the email info and attachments
#                 email_info = extract_attachments(eml_content, destination_path)

#                 if email_info:
#                     return ({'error': 0, 'data': email_info})
#                 else:
#                     return ({'error': 1, 'message': 'Failed to extract email info'})

#             else:
#                 return ({'error': 1, 'message': 'No file uploaded'})

#         except Exception as e:
#             return ({'status': 'error', 'message': str(e)})



        #         if email_info:
        #             return JsonResponse({'status': 'success', 'data': email_info}, status=200)
        #         else:
        #             return JsonResponse({'status': 'error', 'message': 'Failed to extract email info'}, status=500)

        #     else:
        #         return JsonResponse({'status': 'error', 'message': 'No file uploaded'}, status=400)

        # except Exception as e:
        #     return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
