import io
from decimal import Decimal
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import ReportCard, TermResult, SubjectResult
from school_ops.models import Attendance
from users.models import User


def _ordinal(n: int) -> str:
    if 11 <= (n % 100) <= 13:
        return f"{n}th"
    return f"{n}{['th','st','nd','rd','th','th','th','th','th','th'][n % 10]}"


def generate_report_card_pdf(report_card: ReportCard) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    school = report_card.student.madrasah
    term = report_card.term
    student = report_card.student
    term_result = report_card.term_result
    subject_results = SubjectResult.objects.filter(
        student=student, term=term
    ).select_related('subject').order_by('subject__name_en')

    # Custom styles
    title_style = ParagraphStyle(
        'CardTitle', parent=styles['Title'],
        fontSize=20, textColor=colors.HexColor('#1a5276'),
        spaceAfter=2 * mm, alignment=TA_CENTER,
    )
    subtitle_style = ParagraphStyle(
        'CardSubtitle', parent=styles['Normal'],
        fontSize=11, textColor=colors.HexColor('#555555'),
        alignment=TA_CENTER, spaceAfter=4 * mm,
    )
    section_style = ParagraphStyle(
        'SectionHead', parent=styles['Heading2'],
        fontSize=12, textColor=colors.HexColor('#1a5276'),
        spaceBefore=6 * mm, spaceAfter=3 * mm,
    )
    body_style = ParagraphStyle(
        'CardBody', parent=styles['Normal'],
        fontSize=10, leading=14, spaceAfter=2 * mm,
    )
    small_style = ParagraphStyle(
        'Small', parent=styles['Normal'],
        fontSize=8, textColor=colors.HexColor('#888888'),
    )
    comment_style = ParagraphStyle(
        'Comment', parent=styles['Normal'],
        fontSize=10, leading=14, spaceAfter=2 * mm,
        leftIndent=4 * mm,
    )

    elements = []

    # ── Header ──
    elements.append(Paragraph(school.name, title_style))
    if school.address:
        elements.append(Paragraph(school.address, subtitle_style))
    elements.append(Paragraph('STUDENT REPORT CARD', ParagraphStyle(
        'ReportTitle', parent=styles['Title'],
        fontSize=14, textColor=colors.HexColor('#2c3e50'),
        spaceAfter=2 * mm, alignment=TA_CENTER,
    )))
    elements.append(Paragraph(
        f"{term.session} — Term {term.term_number}",
        subtitle_style,
    ))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#1a5276')))
    elements.append(Spacer(1, 4 * mm))

    # ── Student Info ──
    elements.append(Paragraph('Student Information', section_style))
    info_data = [
        ['Name:', student.get_full_name(), 'Class:', report_card.school_class.name_en or report_card.school_class.name_ar],
        ['Email:', student.email, 'Student ID:', str(student.id)],
        ['DOB:', str(student.date_of_birth) if student.date_of_birth else '—', 'Term:', f"Term {term.term_number}"],
    ]
    info_table = Table(info_data, colWidths=[70, 170, 70, 170])
    info_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555555')),
        ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#555555')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 4 * mm))

    # ── Academic Results ──
    elements.append(Paragraph('Academic Results', section_style))
    subject_header = ['Subject', 'Score', 'Grade', 'GPA', 'Remark']
    subject_rows = [subject_header]
    for sr in subject_results:
        subject_rows.append([
            sr.subject.name_en or sr.subject.name_ar,
            f'{sr.total_score:.1f}',
            sr.grade or '—',
            f'{sr.gpa_points:.1f}',
            sr.grade_remark or '—',
        ])

    if subject_rows:
        subject_table = Table(subject_rows, colWidths=[150, 60, 50, 50, 170])
        subject_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a5276')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (1, 0), (3, -1), 'CENTER'),
            # Body
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dee2e6')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(subject_table)
    else:
        elements.append(Paragraph('<i>No subject results available for this term.</i>', body_style))

    elements.append(Spacer(1, 4 * mm))

    # ── Summary ──
    elements.append(Paragraph('Term Summary', section_style))
    pos_text = _ordinal(term_result.position) if term_result.position else '—'
    summary_data = [
        ['Average Score:', f'{term_result.average_score:.1f}%', 'Grade:', term_result.grade or '—'],
        ['GPA:', f'{term_result.gpa:.2f}', 'Position:', f'{pos_text} of {term_result.class_size}'],
        ['Subjects Passed:', str(term_result.subjects_passed), 'Subjects Failed:', str(term_result.subjects_failed)],
    ]
    summary_table = Table(summary_data, colWidths=[90, 140, 90, 160])
    summary_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555555')),
        ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#555555')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 4 * mm))

    # ── Attendance ──
    elements.append(Paragraph('Attendance', section_style))
    total = report_card.attendance_total_days
    if total > 0:
        rate = report_card.attendance_rate
        att_data = [
            ['Total Days:', str(total), 'Present:', str(report_card.attendance_present)],
            ['Absent:', str(report_card.attendance_absent), 'Late:', str(report_card.attendance_late)],
            ['Excused:', str(report_card.attendance_excused), 'Attendance Rate:', f'{rate:.1f}%'],
        ]
        att_table = Table(att_data, colWidths=[90, 140, 90, 160])
        att_table.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555555')),
            ('TEXTCOLOR', (2, 0), (2, -1), colors.HexColor('#555555')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(att_table)
    else:
        elements.append(Paragraph('<i>No attendance data recorded.</i>', body_style))

    elements.append(Spacer(1, 4 * mm))

    # ── Comments ──
    if report_card.teacher_comment or term_result.teacher_comment:
        elements.append(Paragraph('Teacher Comment', section_style))
        elements.append(Paragraph(
            report_card.teacher_comment or term_result.teacher_comment,
            comment_style,
        ))

    if report_card.principal_comment or term_result.principal_comment:
        elements.append(Paragraph('Principal Comment', section_style))
        elements.append(Paragraph(
            report_card.principal_comment or term_result.principal_comment,
            comment_style,
        ))

    # ── Footer ──
    elements.append(Spacer(1, 10 * mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cccccc')))
    elements.append(Spacer(1, 2 * mm))
    elements.append(Paragraph(
        f"Generated on {report_card.generated_at.strftime('%d %B %Y at %H:%M')}",
        small_style,
    ))

    doc.build(elements)
    return buf.getvalue()


class GenerateReportCardPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, uuid):
        try:
            rc = ReportCard.objects.select_related(
                'student', 'term__session', 'school_class', 'term_result', 'student__madrasah',
            ).get(uuid=uuid, student__madrasah=request.user.madrasah)
        except ReportCard.DoesNotExist:
            return HttpResponse('Report card not found', status=404)

        pdf_bytes = generate_report_card_pdf(rc)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"report_card_{rc.student.get_full_name().replace(' ', '_')}_{rc.term}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class GenerateReportCardByStudentTermView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id, term_id):
        try:
            rc = ReportCard.objects.select_related(
                'student', 'term__session', 'school_class', 'term_result', 'student__madrasah',
            ).get(
                student_id=student_id, term_id=term_id,
                student__madrasah=request.user.madrasah,
            )
        except ReportCard.DoesNotExist:
            return HttpResponse('Report card not found', status=404)

        pdf_bytes = generate_report_card_pdf(rc)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"report_card_{rc.student.get_full_name().replace(' ', '_')}_{rc.term}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
