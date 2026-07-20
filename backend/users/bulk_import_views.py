import csv
import io
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, Madrasah


class BulkUserImportView(APIView):
    def post(self, request):
        if request.user.role != 'mudeer':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded = csv_file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
        except Exception:
            return Response({'error': 'Invalid CSV file'}, status=status.HTTP_400_BAD_REQUEST)

        required_cols = {'email', 'first_name', 'last_name', 'role'}
        if not required_cols.issubset(set(reader.fieldnames or [])):
            return Response(
                {'error': f'CSV must have columns: {", ".join(required_cols)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        errors = []
        madrasah = request.user.madrasah

        for i, row in enumerate(reader, start=2):
            try:
                role = row['role'].strip().lower()
                role_map = {'ustaadh': 'ustaadh', 'teacher': 'ustaadh', 'student': 'student', 'parent': 'parent', 'mudeer': 'mudeer', 'admin': 'mudeer'}
                role = role_map.get(role, role)
                if role not in ('ustaadh', 'student', 'parent', 'mudeer', 'idaarah'):
                    errors.append({'row': i, 'error': f'Invalid role: {row["role"].strip()}'})
                    continue

                email = row['email'].strip().lower()
                if User.objects.filter(email=email).exists():
                    errors.append({'row': i, 'error': f'Email {email} already exists'})
                    continue

                password = row.get('password', '').strip() or 'changeme123'

                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=row['first_name'].strip(),
                    last_name=row['last_name'].strip(),
                    role=role,
                    madrasah=madrasah,
                )
                created.append({'id': user.id, 'email': email, 'name': user.get_full_name()})
            except Exception as e:
                errors.append({'row': i, 'error': str(e)})

        return Response({
            'created': len(created),
            'errors': errors,
            'users': created,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST)