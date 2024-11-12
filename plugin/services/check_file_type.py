

# import os
# import PyPDF2
# import json
# import pandas as pd
# import xml.etree.ElementTree as ET
# from docx import Document
# from pptx import Presentation
# from striprtf.striprtf import rtf_to_text
# from flask import Flask, jsonify, request
# # from Components.ms_excel_processor import main_disable_links
# import mimetypes


# # Define the folder path
# def createFile(content,path):
#     # path_file = 'E:\\extensions\\server\\eml_backup\\' + messageId+ "\\" + messageId+".txt"
#     file_path = path + "\\" + "test.txt"
#     f = open(file_path,"a")
#     f.write(content)
#     f.close()


# def guess_type_of(link, strict=True):
#     link_type, _ = mimetypes.guess_type(link)
#     if link_type is None and strict:
#         u = urllib.urlopen(link)
#         link_type = u.headers.gettype() # or using: u.info().gettype()
#     return link_type
   
# # Function to read pptx files
# def read_pptx(file_path):
#     presentation = Presentation(file_path)
#     text = ''
#     for slide in presentation.slides:
#         for shape in slide.shapes:
#             if hasattr(shape, 'text'):
#                 text += shape.text + '\n'
#     return text

# # Function to read pdf files
# def read_pdf(file_path):
#     text = ''
#     with open(file_path, 'rb') as file:
#         pdf_reader = PyPDF2.PdfReader(file)
#         for page_number in range(len(pdf_reader.pages)):
#             page = pdf_reader.pages[page_number]
#             text += page.extract_text() + '\n'
#     return text

# # Function to read txt files
# def read_txt(file_path):
#     with open(file_path, 'r') as file:
#         text = file.read()
#     return text

# # Function to read docx files
# def read_docx(file_path):
#     doc = Document(file_path)
#     text = ''
#     for paragraph in doc.paragraphs:
#         text += paragraph.text + '\n'
#     return text

# # Function to read xlsx files
# def read_xlsx(file_path,attachment_name):
#     df = pd.read_excel(file_path)
#     text = df.to_string(index=False)
#     print("<<<<<<<>>>>>>>>>>cxlsx")
#     print(attachment_name[0]['filename'])
#     print(file_path)
#     # path = 'D:\\phishing plugin\\backend\\eml_backup\\18f0f8c7526b640b\\' + attachment_name[0]['filename']
#     # print(path)
#     # final_path = file_path + "\\" +  attachment_name[0]['filename']
#     # print(final_path)
#     print("read_xlsx_before result")
#     # result =  main_disable_links(file_path)
#     return text

# # Function to read csv files
# def read_csv(file_path):
#     df = pd.read_csv(file_path)
#     text = df.to_string(index=False)
#     return text

# # Function to read json files
# def read_json(file_path):
#     with open(file_path, 'r') as file:
#         data = json.load(file)
#     return json.dumps(data, indent=4)

# # Function to read html files
# def read_html(file_path):
#     with open(file_path, 'r') as file:
#         text = file.read()
#     return text

# # Function to read xml files
# def read_xml(file_path):
#     tree = ET.parse(file_path)
#     root = tree.getroot()
#     text = ET.tostring(root, encoding='unicode')
#     return text

# # Function to read RTF files
# def read_rtf_text(file_path):
#     try:
#       with open(file_path, 'rb') as f:
#         rtf_content = f.read()
#       text = rtf_to_text(rtf_content.decode('latin-1'))
#       return text
#     except FileNotFoundError:
#       print(f"Error: File not found at {file_path}")
#     except Exception as e:
#       print(f"Error reading RTF file: {e}")
#     return None

# # Function to read conf files
# def read_conf(file_path):
#     with open(file_path, 'r') as file:
#         text = file.read()
#     return text

# # Loop through each file in the folder and read its contents
# def main(path,attachment_name):
#   print(attachment_name)
#   print(path)
# #   folder_path = 'E:\\extensions\\server\\test_flattening\\text'
#   folder_path = path
#   text_hi=''
  
#   for file_name in os.listdir(folder_path):
#     file_path = os.path.join(folder_path, file_name)
#     if file_name.endswith('.pptx'):
#         text = read_pptx(file_path)
#     elif file_name.endswith('.pdf'):
#         text = read_pdf(file_path)
#     elif file_name.endswith('.txt'):
#         text = read_txt(file_path)
#     elif file_name.endswith('.docx'):
#         text = read_docx(file_path)
#     elif file_name.endswith('.xlsx'):
#         text = read_xlsx(file_path,attachment_name)
#     elif file_name.endswith('.csv'):
#         text = read_csv(file_path)
#     elif file_name.endswith('.json'):
#         text = read_json(file_path)
#     elif file_name.endswith('.html'):
#         text = read_html(file_path)
#     elif file_name.endswith('.xml'):    
#         text = read_xml(file_path)
#     elif file_name.endswith('.rtf'):
#         text = read_rtf_text(file_path)
#     elif file_name.endswith('.conf'):
#         text = read_conf(file_path)
#     else:
#         print(f'Unsupported file format: {file_name}')
#         continue
#     print()
#     print()
#     print()
#     print()
#     createFile(text,path)
#     print(f'Contents of {file_name}:')
#     print(text)
#     text_hi += text

#   text_hi[-200:-1]
#   msg = "Done"
#   return (msg)

