from django.http import JsonResponse
from django.db import connection
import json


def dispute_count(data):
    try:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT COUNT(*) AS total_disputes
            FROM plugin_dispute
            WHERE status = 'Pending'
        """)
        row = cursor.fetchone()
        total_disputes = row[0] if row else 0
        return JsonResponse({"total_disputes": total_disputes})
    except Exception as e:
        return JsonResponse({"error": str(e)})