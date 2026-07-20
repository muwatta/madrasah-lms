from celery import shared_task
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta, date


@shared_task
def generate_at_risk_predictions(madrasah_id):
    from users.models import User
    from school_ops.models import Attendance
    from assessments.models import QuizAttempt
    from lessons.models import Homework, HomeworkSubmission
    from analytics.models import AtRiskPrediction

    madrasah_id = int(madrasah_id) if not isinstance(madrasah_id, int) else madrasah_id
    students = User.objects.filter(madrasah_id=madrasah_id, role='student', is_active=True)
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    att_window = today - timedelta(days=90)

    student_ids = list(students.values_list('id', flat=True))
    if not student_ids:
        return {'generated': 0, 'summary': {'low': 0, 'moderate': 0, 'high': 0, 'critical': 0}}

    att_stats = Attendance.objects.filter(
        student_id__in=student_ids, madrasah_id=madrasah_id, date__gte=att_window,
    ).values('student_id').annotate(
        total=Count('id'),
        present=Count('id', filter=Q(status__in=['present', 'late'])),
    )
    att_map = {s['student_id']: s for s in att_stats}

    quiz_stats = QuizAttempt.objects.filter(
        student_id__in=student_ids, percentage__isnull=False,
    ).values('student_id').annotate(avg=Avg('percentage'))
    quiz_map = {s['student_id']: float(s['avg']) for s in quiz_stats if s['avg']}

    hw_assigned_stats = Homework.objects.filter(
        madrasah_id=madrasah_id, is_published=True,
        school_class__enrollments__student_id__in=student_ids,
    ).values('school_class__enrollments__student_id').annotate(
        count=Count('id', distinct=True),
    )
    hw_assigned_map = {s['school_class__enrollments__student_id']: s['count'] for s in hw_assigned_stats}

    hw_submitted_stats = HomeworkSubmission.objects.filter(
        student_id__in=student_ids, madrasah_id=madrasah_id,
    ).values('student_id').annotate(count=Count('homework', distinct=True))
    hw_submitted_map = {s['student_id']: s['count'] for s in hw_submitted_stats}

    from collections import defaultdict
    recent_att_all = Attendance.objects.filter(
        student_id__in=student_ids, madrasah_id=madrasah_id, date__gte=thirty_days_ago,
    ).order_by('student_id', '-date')
    student_att_records = defaultdict(list)
    for att in recent_att_all:
        student_att_records[att.student_id].append(att)

    counts = {'low': 0, 'moderate': 0, 'high': 0, 'critical': 0}

    for student in students:
        sid = student.id
        att_row = att_map.get(sid, {})
        att_total = att_row.get('total', 0)
        att_present = att_row.get('present', 0)
        attendance_rate = att_present / att_total if att_total > 0 else 1.0

        avg_score = quiz_map.get(sid, 50.0)
        homeworks_assigned = hw_assigned_map.get(sid, 0)
        homeworks_submitted = hw_submitted_map.get(sid, 0)
        hw_completion = homeworks_submitted / homeworks_assigned if homeworks_assigned > 0 else 1.0

        consecutive = 0
        for att in student_att_records.get(sid, []):
            if att.status == 'absent':
                consecutive += 1
            else:
                break

        factors = {
            'attendance_rate': round(attendance_rate, 3),
            'avg_score': round(avg_score, 1),
            'homework_completion': round(hw_completion, 3),
            'missing_assignments': max(homeworks_assigned - homeworks_submitted, 0),
            'consecutive_absences': consecutive,
        }

        att_risk = (1 - attendance_rate) * 30
        score_risk = max(0, (60 - avg_score) / 60) * 25
        hw_risk = (1 - hw_completion) * 25
        absence_risk = min(consecutive / 10, 1) * 20
        risk_score = round(att_risk + score_risk + hw_risk + absence_risk, 2)
        risk_score = min(max(risk_score, 0), 100)

        if risk_score >= 70:
            risk_level = 'critical'
        elif risk_score >= 50:
            risk_level = 'high'
        elif risk_score >= 30:
            risk_level = 'moderate'
        else:
            risk_level = 'low'

        counts[risk_level] += 1

        recs = []
        if attendance_rate < 0.8:
            recs.append("Follow up on attendance - student absent more than 20% of the time")
        if avg_score < 60:
            recs.append("Schedule academic support sessions - average score below 60%")
        if hw_completion < 0.6:
            recs.append("Check homework submission barriers - completion rate below 60%")
        if consecutive >= 3:
            recs.append("Contact parents/guardians - consecutive absences detected")
        if not recs:
            recs.append("Student is performing well - continue monitoring")

        AtRiskPrediction.objects.update_or_create(
            madrasah_id=madrasah_id,
            student=student,
            defaults={
                'risk_score': risk_score,
                'risk_level': risk_level,
                'factors': factors,
                'recommendations': '\n'.join(recs),
                'is_active': True,
            },
        )

    return {'generated': len(student_ids), 'summary': counts}
