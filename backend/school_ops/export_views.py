import csv
from django.http import HttpResponse
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Attendance, Fee, FeePayment


class ExportAttendanceView(APIView):
    def get(self, request):
        fmt = request.query_params.get('format', 'csv')
        qs = Attendance.objects.filter(
            madrasah=request.user.madrasah
        ).select_related('student', 'marked_by')

        date_from = request.query_params.get('from')
        date_to = request.query_params.get('to')
        status = request.query_params.get('status')
        class_id = request.query_params.get('class_id')

        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if status:
            qs = qs.filter(status=status)
        if class_id:
            qs = qs.filter(student__enrollments__school_class_id=class_id)

        data = []
        for a in qs:
            data.append({
                'student_id': a.student.id,
                'student_name': a.student.get_full_name(),
                'student_email': a.student.email,
                'date': a.date.isoformat(),
                'status': a.status,
                'marked_by': a.marked_by.get_full_name() if a.marked_by else '',
                'notes': a.notes or '',
                'marked_at': a.marked_at.isoformat() if a.marked_at else '',
            })

        if fmt == 'json':
            return Response(data)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="attendance_export.csv"'
        if data:
            writer = csv.DictWriter(response, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return response


class ExportFeesView(APIView):
    def get(self, request):
        fmt = request.query_params.get('format', 'csv')
        qs = Fee.objects.filter(
            madrasah=request.user.madrasah
        ).select_related('student', 'fee_structure')

        status = request.query_params.get('status')
        class_id = request.query_params.get('class_id')

        if status:
            qs = qs.filter(status=status)
        if class_id:
            qs = qs.filter(student__enrollments__school_class_id=class_id)

        data = []
        for f in qs:
            data.append({
                'student_id': f.student.id,
                'student_name': f.student.get_full_name(),
                'fee_structure': f.fee_structure.name if f.fee_structure else '',
                'amount': float(f.amount),
                'amount_paid': float(f.amount_paid),
                'balance': float(f.balance),
                'due_date': f.due_date.isoformat(),
                'description': f.description or '',
                'status': f.status,
            })

        if fmt == 'json':
            return Response(data)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="fees_export.csv"'
        if data:
            writer = csv.DictWriter(response, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return response


class ExportFeePaymentsView(APIView):
    def get(self, request):
        fmt = request.query_params.get('format', 'csv')
        qs = FeePayment.objects.filter(
            fee__madrasah=request.user.madrasah
        ).select_related('fee__student', 'recorded_by')

        date_from = request.query_params.get('from')
        date_to = request.query_params.get('to')

        if date_from:
            qs = qs.filter(payment_date__gte=date_from)
        if date_to:
            qs = qs.filter(payment_date__lte=date_to)

        data = []
        for p in qs:
            data.append({
                'student': p.fee.student.get_full_name(),
                'amount_paid': float(p.amount_paid),
                'payment_date': p.payment_date.isoformat(),
                'payment_method': p.payment_method,
                'transaction_id': p.transaction_id or '',
                'notes': p.notes or '',
                'recorded_by': p.recorded_by.get_full_name() if p.recorded_by else '',
            })

        if fmt == 'json':
            return Response(data)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="fee_payments_export.csv"'
        if data:
            writer = csv.DictWriter(response, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        return response
