import csv
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import User


class ExportUsersView(APIView):
    def get(self, request):
        fmt = request.query_params.get('format', 'csv')
        role = request.query_params.get('role')

        qs = User.objects.filter(madrasah=request.user.madrasah, is_active=True)
        if role:
            qs = qs.filter(role=role)

        data = []
        for u in qs:
            data.append({
                'id': u.id,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'email': u.email,
                'role': u.role,
                'date_of_birth': u.date_of_birth.isoformat() if u.date_of_birth else '',
                'email_verified': u.email_verified,
                'date_joined': u.date_joined.isoformat(),
            })

        if fmt == 'json':
            return Response(data)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="users_export.csv"'
        if data:
            writer = csv.DictWriter(response, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return response
