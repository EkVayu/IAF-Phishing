import hashlib
import os
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AgentFile


logger = logging.getLogger(__name__)

@receiver(post_save, sender=AgentFile)
def calculate_file_metadata(sender, instance, **kwargs):
    """
    Calculate the file size and checksum after the AgentFile is saved.
    This function is triggered by the post_save signal for AgentFile.
    """
    if instance.file and not instance.size:
        file_path = instance.file.path
        
        if os.path.exists(file_path):
            try:
                with open(file_path, 'rb') as f:
                    data = f.read()
                    # Calculate the size of the file in bytes
                    instance.size = len(data)
                    # Calculate the SHA256 checksum of the file
                    instance.checksum = hashlib.sha256(data).hexdigest()
                    # Save the updated fields
                    instance.save()
            except Exception as e:
                # Log the error instead of printing it
                logger.error(f"Error reading file {file_path}: {str(e)}")
        else:
            logger.warning(f"File not found: {file_path}")