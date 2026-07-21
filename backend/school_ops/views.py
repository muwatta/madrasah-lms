import logging

from rest_framework import generics, status, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum, Count, Q, Avg, F, FloatField
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
from .models import FeeStructure, Fee, FeePayment, Attendance, Announcement, Notification, AttendanceQRScan
from .serializers import (
    FeeStructureSerializer, FeeSerializer, FeePaymentSerializer,
    AttendanceSerializer, AnnouncementSerializer, NotificationSerializer,
    AttendanceQRScanSerializer,
)
from .services import QRService
from config.permissions import IsMudeer, IsStaff
from curriculum.models import Enrollment, SchoolClass
from users.models import User, StudentParent

logger = logging.getLogger(__name__)


class FeeStructureListView(generics.ListCreateAPIView):
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated, IsMudeer]

    def get_queryset(self):
        return FeeStructure.objects.filter(madrasah=self.request.user.madrasah)

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class FeeListView(generics.ListCreateAPIView):
    serializer_class = FeeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Fee.objects.filter(madrasah=user.madrasah).select_related('student', 'fee_structure').prefetch_related('payments')

        if user.role == 'student':
            qs = qs.filter(student=user)
        elif user.role == 'parent':
            student_ids = StudentParent.objects.filter(parent=user).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=student_ids)

        student_id = self.request.query_params.get('student')
        status_filter = self.request.query_params.get('status')
        if student_id:
            qs = qs.filter(student_id=student_id)
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs

    def perform_create(self, serializer):
        if self.request.user.role not in ('mudeer', 'idaarah'):
            raise PermissionDenied()
        serializer.save(madrasah=self.request.user.madrasah)


class FeeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FeeSerializer

    def get_queryset(self):
        return Fee.objects.filter(madrasah=self.request.user.madrasah).select_related(
            'student', 'fee_structure'
        ).prefetch_related('payments')

    def perform_destroy(self, instance):
        if self.request.user.role not in ('mudeer', 'idaarah'):
            raise PermissionDenied()
        instance.delete()


class FeePaymentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, fee_id):
        if request.user.role not in ('mudeer', 'idaarah', 'parent'):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            fee = Fee.objects.get(pk=fee_id, madrasah=request.user.madrasah)
        except Fee.DoesNotExist:
            return Response({'error': 'Fee not found'}, status=status.HTTP_404_NOT_FOUND)

        amount = request.data.get('amount_paid') or request.data.get('amount')
        if amount is None:
            return Response({'error': 'amount_paid required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            amount = Decimal(str(amount))
        except Exception:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'error': 'Amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)

        valid_methods = [c[0] for c in FeePayment.METHOD_CHOICES]
        method = request.data.get('payment_method', 'cash')
        if method not in valid_methods:
            method = 'cash'

        payment = FeePayment.objects.create(
            fee=fee,
            amount_paid=amount,
            payment_method=method,
            transaction_id=request.data.get('transaction_id', ''),
            notes=request.data.get('notes', ''),
            recorded_by=request.user,
        )

        fee.amount_paid = F('amount_paid') + amount
        fee.save(update_fields=['amount_paid'])
        fee.refresh_from_db()

        if fee.amount_paid >= fee.amount:
            fee.status = 'paid'
        elif fee.amount_paid > 0:
            fee.status = 'partial'
        fee.save(update_fields=['status'])

        logger.info(
            "Fee payment created: fee=%s amount=%s method=%s recorded_by=%s",
            fee.id, amount, method, request.user.id,
        )
        return Response(FeePaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class FeeAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsMudeer]

    def get(self, request):
        madrasah = request.user.madrasah
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_fees = Fee.objects.filter(madrasah=madrasah)
        total_amount = total_fees.aggregate(total=Coalesce(Sum('amount'), 0))['total']
        total_collected = total_fees.aggregate(total=Coalesce(Sum('amount_paid'), 0))['total']
        outstanding = total_amount - total_collected

        overdue_fees = total_fees.filter(status='overdue')
        overdue_count = overdue_fees.count()

        this_month_collected = FeePayment.objects.filter(
            fee__madrasah=madrasah,
            payment_date__gte=month_start.date(),
        ).aggregate(total=Coalesce(Sum('amount_paid'), 0))['total']

        monthly_data = []
        today = timezone.now().date()
        six_months_ago = today - timedelta(days=180)
        month_start = six_months_ago.replace(day=1)
        monthly_aggregated = FeePayment.objects.filter(
            fee__madrasah=madrasah,
            payment_date__gte=month_start,
        ).annotate(
            month=TruncMonth('payment_date')
        ).values('month').annotate(
            total=Coalesce(Sum('amount_paid'), 0)
        ).order_by('month')
        month_map = {row['month']: row['total'] for row in monthly_aggregated}
        cursor = month_start
        while cursor <= today:
            month_label = cursor.strftime('%b')
            month_key = cursor.replace(day=1)
            collected = month_map.get(month_key, 0)
            monthly_data.append({
                'month': month_label,
                'collected': float(collected),
                'outstanding': float(outstanding / 6) if outstanding > 0 else 0,
            })
            if cursor.month == 12:
                cursor = cursor.replace(year=cursor.year + 1, month=1)
            else:
                cursor = cursor.replace(month=cursor.month + 1)

        recent_payments = FeePayment.objects.filter(
            fee__madrasah=madrasah
        ).select_related('fee', 'fee__student')[:10]

        return Response({
            'total_amount': float(total_amount),
            'total_collected': float(total_collected),
            'outstanding': float(outstanding),
            'overdue_count': overdue_count,
            'overdue_amount': float(overdue_count * total_amount / max(total_fees.count(), 1)),
            'this_month_collected': float(this_month_collected),
            'monthly_data': monthly_data,
            'recent_payments': [{
                'id': p.id,
                'student_name': p.fee.student.get_full_name(),
                'amount': float(p.amount_paid),
                'method': p.payment_method,
                'paid_at': p.payment_date.isoformat(),
                'date': p.payment_date.isoformat(),
            } for p in recent_payments],
        })


class BulkFeeCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsMudeer]

    def post(self, request):
        student_ids = request.data.get('student_ids', [])
        fee_structure_id = request.data.get('fee_structure')
        amount = request.data.get('amount')
        due_date = request.data.get('due_date')
        description = request.data.get('description', '')

        if not due_date:
            return Response({'error': 'due_date required'}, status=status.HTTP_400_BAD_REQUEST)

        if fee_structure_id:
            try:
                fs = FeeStructure.objects.get(id=fee_structure_id, madrasah=request.user.madrasah)
                amount = fs.amount
                description = fs.name
            except FeeStructure.DoesNotExist:
                return Response({'error': 'Fee structure not found'}, status=status.HTTP_404_NOT_FOUND)

        if not amount:
            return Response({'error': 'amount or fee_structure required'}, status=status.HTTP_400_BAD_REQUEST)

        if not student_ids:
            students = User.objects.filter(madrasah=request.user.madrasah, role='student')
            student_ids = list(students.values_list('id', flat=True))

        valid_student_ids = set(
            User.objects.filter(
                id__in=student_ids, madrasah=request.user.madrasah, role='student'
            ).values_list('id', flat=True)
        )
        existing_student_ids = set(
            Fee.objects.filter(
                madrasah=request.user.madrasah,
                student_id__in=valid_student_ids,
                amount=amount,
                due_date=due_date,
            ).values_list('student_id', flat=True)
        )

        fees_to_create = [
            Fee(
                madrasah=request.user.madrasah,
                student_id=sid,
                fee_structure_id=fee_structure_id if fee_structure_id else None,
                amount=amount,
                due_date=due_date,
                description=description,
                status='pending',
            )
            for sid in valid_student_ids
            if sid not in existing_student_ids
        ]

        Fee.objects.bulk_create(fees_to_create, ignore_conflicts=True)

        logger.info("Bulk fees created: count=%s by user %s", len(fees_to_create), request.user.id)
        return Response({'created': len(fees_to_create)}, status=status.HTTP_201_CREATED)


class AttendanceListView(generics.ListCreateAPIView):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Attendance.objects.filter(madrasah=user.madrasah).select_related('student', 'marked_by')

        if user.role == 'student':
            qs = qs.filter(student=user)
        elif user.role == 'parent':
            student_ids = StudentParent.objects.filter(parent=user).values_list('student_id', flat=True)
            qs = qs.filter(student_id__in=student_ids)

        date_filter = self.request.query_params.get('date')
        student_id = self.request.query_params.get('student')
        if date_filter:
            qs = qs.filter(date=date_filter)
        if student_id:
            qs = qs.filter(student_id=student_id)

        return qs

    def perform_create(self, serializer):
        if self.request.user.role not in ('mudeer', 'ustaadh', 'idaarah'):
            raise PermissionDenied()
        serializer.save(madrasah=self.request.user.madrasah, marked_by=self.request.user)


class BulkAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def post(self, request):
        records = request.data.get('records', [])
        date_str = request.data.get('date')
        if not records or not date_str:
            return Response({'error': 'records and date required'}, status=status.HTTP_400_BAD_REQUEST)

        student_ids = [rec.get('student') for rec in records if rec.get('student')]
        valid_student_ids = set(
            User.objects.filter(
                id__in=student_ids, madrasah=request.user.madrasah, role='student',
            ).values_list('id', flat=True)
        )

        created = []
        skipped = 0
        for rec in records:
            student_id = rec.get('student')
            status_val = rec.get('status')
            if not student_id or not status_val:
                skipped += 1
                continue
            if student_id not in valid_student_ids:
                skipped += 1
                continue
            obj, _ = Attendance.objects.update_or_create(
                madrasah=request.user.madrasah,
                student_id=student_id,
                date=date_str,
                defaults={
                    'status': status_val,
                    'marked_by': request.user,
                    'notes': rec.get('notes', ''),
                }
            )
            created.append(obj.id)

        logger.info(
            "Bulk attendance saved: date=%s created=%s skipped=%s by user %s",
            date_str, len(created), skipped, request.user.id,
        )
        return Response({
            'created': len(created),
            'skipped': skipped,
        }, status=status.HTTP_201_CREATED)


class AttendanceAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        madrasah = user.madrasah
        today = date.today()
        week_ago = today - timedelta(days=7)

        if user.role == 'student':
            student_attendance = Attendance.objects.filter(student=user, date__gte=week_ago)
            total = student_attendance.count()
            present = student_attendance.filter(status='present').count()
            absent = student_attendance.filter(status='absent').count()
            late = student_attendance.filter(status='late').count()
            excused = student_attendance.filter(status='excused').count()
            recent = student_attendance.order_by('-date')[:10].values('id', 'date', 'status')
            return Response({
                'total_days': total,
                'days_present': present,
                'days_absent': absent,
                'days_late': late,
                'days_excused': excused,
                'weekly_rate': round((present / total) * 100, 1) if total > 0 else 0,
                'recent_records': [
                    {'id': r['id'], 'date': r['date'].isoformat(), 'status': r['status']}
                    for r in recent
                ],
            })

        if user.role == 'parent':
            student_ids = list(StudentParent.objects.filter(parent=user).values_list('student_id', flat=True))
            children_users = {u.id: u for u in User.objects.filter(id__in=student_ids)}
            att_summary = Attendance.objects.filter(
                student_id__in=student_ids, date__gte=week_ago
            ).values('student_id').annotate(
                total=Count('id'),
                present=Count('id', filter=Q(status='present')),
            )
            children_data = []
            for row in att_summary:
                sid = row['student_id']
                student = children_users.get(sid)
                if not student:
                    continue
                children_data.append({
                    'student_id': sid,
                    'name': student.get_full_name(),
                    'attendance_rate': round((row['present'] / row['total']) * 100, 1) if row['total'] > 0 else 0,
                    'total_days': row['total'],
                    'present': row['present'],
                })
            return Response({'children': children_data})

        today_attendance = Attendance.objects.filter(madrasah=madrasah, date=today)
        today_absent = today_attendance.filter(status='absent').count()
        today_late = today_attendance.filter(status='late').count()

        week_attendance = Attendance.objects.filter(madrasah=madrasah, date__gte=week_ago)
        week_total = week_attendance.count()
        week_present = week_attendance.filter(status='present').count()

        week_data = Attendance.objects.filter(
            madrasah=madrasah, date__gte=week_ago, date__lte=today
        ).values('date').annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='present')),
        )
        day_map = {row['date']: row for row in week_data}

        daily_trend = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            row = day_map.get(d, {})
            daily_trend.append({
                'date': d.strftime('%a'),
                'present': row.get('present', 0),
                'total': row.get('total', 0),
            })

        student_rates = list(
            User.objects.filter(madrasah=madrasah, role='student').annotate(
                att_total=Coalesce(
                    Count('attendances', filter=Q(attendances__date__gte=week_ago)),
                    0
                ),
                att_present=Coalesce(
                    Count('attendances', filter=Q(attendances__date__gte=week_ago, attendances__status='present')),
                    0
                ),
            ).values('id', 'first_name', 'last_name', 'att_total', 'att_present')
        )

        student_rates_data = []
        for s in student_rates:
            rate = round((s['att_present'] / s['att_total']) * 100, 1) if s['att_total'] > 0 else 0
            student_rates_data.append({
                'student_id': s['id'],
                'name': f"{s['first_name']} {s['last_name']}",
                'attendance_rate': rate,
                'days_total': s['att_total'],
            })

        return Response({
            'today_absent': today_absent,
            'today_late': today_late,
            'week_attendance_rate': round((week_present / week_total) * 100, 1) if week_total > 0 else 0,
            'daily_trend': daily_trend,
            'student_rates': sorted(student_rates_data, key=lambda x: x['attendance_rate']),
        })


class AnnouncementListView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = user.role
        role_map = {'ustaadh': 'teachers', 'student': 'students', 'parent': 'parents'}
        audience_key = role_map.get(role, 'all')

        return Announcement.objects.filter(
            madrasah=user.madrasah,
        ).filter(
            Q(audience='all') | Q(audience=audience_key)
        ).select_related('created_by')

    def perform_create(self, serializer):
        if self.request.user.role not in ('mudeer', 'idaarah', 'ustaadh'):
            raise PermissionDenied()
        serializer.save(madrasah=self.request.user.madrasah, created_by=self.request.user)


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        return Announcement.objects.filter(madrasah=self.request.user.madrasah).select_related('created_by')

    def perform_destroy(self, instance):
        if self.request.user.role not in ('mudeer', 'idaarah'):
            raise PermissionDenied()
        instance.delete()


class StudentReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        if request.user.role not in ('mudeer', 'idaarah', 'ustaadh', 'parent'):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            student = User.objects.get(id=student_id, role='student', madrasah=request.user.madrasah)
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.role == 'parent':
            is_child = StudentParent.objects.filter(parent=request.user, student=student).exists()
            if not is_child:
                return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        from assessments.models import QuizAttempt
        attempts = QuizAttempt.objects.filter(student=student, submitted_at__isnull=False)
        avg = attempts.aggregate(avg=Avg('percentage'))['avg']

        enrollments = Enrollment.objects.filter(student=student, madrasah=request.user.madrasah).select_related('subject')
        subject_averages = attempts.values('quiz__subject').annotate(
            avg_score=Avg('percentage'),
            attempt_count=Count('id'),
        )
        subject_avg_map = {
            row['quiz__subject']: {
                'average': round(float(row['avg_score']), 1) if row['avg_score'] else 0,
                'attempts': row['attempt_count'],
            }
            for row in subject_averages
        }

        subject_perf = []
        for enrollment in enrollments:
            stats = subject_avg_map.get(enrollment.subject_id, {'average': 0, 'attempts': 0})
            subject_perf.append({
                'subject': enrollment.subject.name_ar,
                'subject_en': enrollment.subject.name_en,
                'average': stats['average'],
                'attempts': stats['attempts'],
            })

        recent_attendance_qs = Attendance.objects.filter(student=student, madrasah=request.user.madrasah)
        att_total = recent_attendance_qs.count()
        att_present = recent_attendance_qs.filter(status='present').count()
        recent_attendance = recent_attendance_qs.order_by('-date')[:30]

        weak_subjects = [s for s in subject_perf if s['average'] > 0 and s['average'] < 60]
        strong_subjects = [s for s in subject_perf if s['average'] >= 80]

        recommendations = []
        if weak_subjects:
            for ws in weak_subjects:
                recommendations.append({
                    'type': 'weak_subject',
                    'subject': ws['subject_en'],
                    'message_ar': f'{ws["subject"]} يحتاج مراجعة (متوسط {ws["average"]}%)',
                    'message_en': f'{ws["subject_en"]} needs review (avg {ws["average"]}%)',
                })
        if att_total > 0 and (att_present / att_total) < 0.8:
            recommendations.append({
                'type': 'attendance',
                'message_ar': 'الغياب مرتفع - يحتاج متابعة',
                'message_en': 'High absence rate - needs follow up',
            })
        if avg and avg >= 85 and not weak_subjects:
            recommendations.append({
                'type': 'advanced',
                'message_ar': 'أداء ممتاز - جاهز لمحتوى متقدم',
                'message_en': 'Excellent performance - ready for advanced content',
            })

        return Response({
            'student': {
                'id': student.id,
                'name': student.get_full_name(),
                'email': student.email,
            },
            'overall_average': round(avg, 1) if avg else 0,
            'total_attempts': attempts.count(),
            'subject_performance': subject_perf,
            'attendance': {
                'rate': round((att_present / att_total) * 100, 1) if att_total > 0 else 0,
                'present': att_present,
                'total': att_total,
            },
            'strong_subjects': strong_subjects,
            'weak_subjects': weak_subjects,
            'recommendations': recommendations,
        })


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() in ('true', '1'))
        return qs


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'status': 'ok'})


class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'marked': count})


class NotificationUnreadCountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'unread_count': count})


class AttendanceQRClassView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get(self, request, class_id):
        try:
            school_class = SchoolClass.objects.get(id=class_id, madrasah=request.user.madrasah)
        except SchoolClass.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)

        qr_service = QRService()
        buf, payload = qr_service.generate_class_qr(school_class, request.user.madrasah)

        import base64
        qr_b64 = base64.b64encode(buf.read()).decode()

        return Response({
            'qr_data_url': f'data:image/png;base64,{qr_b64}',
            'payload': payload,
            'expires_in_seconds': QRService.EXPIRY_MINUTES * 60,
        })


class AttendanceQRStudentView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get(self, request, student_id):
        try:
            student = User.objects.get(id=student_id, madrasah=request.user.madrasah, role='student')
        except User.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        qr_service = QRService()
        buf, payload = qr_service.generate_student_qr(student, request.user.madrasah)

        import base64
        qr_b64 = base64.b64encode(buf.read()).decode()

        return Response({
            'qr_data_url': f'data:image/png;base64,{qr_b64}',
            'payload': payload,
            'expires_in_seconds': QRService.EXPIRY_MINUTES * 60,
        })


class AttendanceScanView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def post(self, request):
        qr_data_raw = request.data.get('qr_data')
        identifier = request.data.get('student_identifier')
        scanner_location = request.data.get('scanner_location', '')

        if not qr_data_raw and not identifier:
            return Response({'error': 'qr_data or student_identifier required'}, status=status.HTTP_400_BAD_REQUEST)

        qr_service = QRService()
        student = None
        school_class = None
        scan_method = 'qr_code'

        if qr_data_raw:
            valid, result = qr_service.verify_qr_data(qr_data_raw)
            if not valid:
                return Response({'error': result}, status=status.HTTP_400_BAD_REQUEST)

            data = result
            try:
                student = User.objects.get(id=data['s'], madrasah=request.user.madrasah, role='student')
            except User.DoesNotExist:
                return Response({'error': 'Student not found in this madrasah'}, status=status.HTTP_400_BAD_REQUEST)

            if data.get('c'):
                try:
                    school_class = SchoolClass.objects.get(id=data['c'], madrasah=request.user.madrasah)
                except SchoolClass.DoesNotExist:
                    pass
        else:
            scan_method = 'rfid'
            try:
                student = User.objects.get(id=identifier, madrasah=request.user.madrasah, role='student')
            except User.DoesNotExist:
                try:
                    student = User.objects.get(email=identifier, madrasah=request.user.madrasah, role='student')
                except User.DoesNotExist:
                    return Response({'error': 'Student not found'}, status=status.HTTP_400_BAD_REQUEST)

        today = date.today()
        if Attendance.objects.filter(student=student, date=today, madrasah=request.user.madrasah).exists():
            return Response({'error': 'Already scanned today', 'student': student.get_full_name()}, status=status.HTTP_409_CONFLICT)

        attendance_status = 'present'

        scan_record = AttendanceQRScan.objects.create(
            madrasah=request.user.madrasah,
            student=student,
            school_class=school_class,
            scanner_location=scanner_location,
            method=scan_method,
            qr_data=qr_data_raw or '',
        )

        attendance = Attendance.objects.create(
            madrasah=request.user.madrasah,
            student=student,
            date=today,
            status=attendance_status,
            marked_by=request.user,
        )

        scan_record.attendance = attendance
        scan_record.save(update_fields=['attendance'])

        logger.info("Attendance scan processed: student=%s method=%s status=%s", student.id, scan_method, attendance_status)
        return Response({
            'status': 'ok',
            'student': student.get_full_name(),
            'attendance_status': attendance_status,
            'attendance_id': attendance.id,
            'scan_id': scan_record.id,
        }, status=status.HTTP_201_CREATED)


class AttendanceScanListView(generics.ListAPIView):
    serializer_class = AttendanceQRScanSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaff]

    def get_queryset(self):
        qs = AttendanceQRScan.objects.filter(
            madrasah=self.request.user.madrasah
        ).select_related('student', 'attendance')

        date_filter = self.request.query_params.get('date')
        if date_filter:
            qs = qs.filter(scanned_at__date=date_filter)
        else:
            qs = qs.filter(scanned_at__date=date.today())

        return qs
