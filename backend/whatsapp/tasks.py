import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta, date

logger = logging.getLogger(__name__)


@shared_task
def send_whatsapp_message(madrasah_id, recipient_id, message_type, variables, template_name=None):
    from .models import WhatsAppRecipient
    from .services import WhatsAppService

    try:
        recipient = WhatsAppRecipient.objects.select_related('madrasah', 'parent').get(
            pk=recipient_id
        )
    except WhatsAppRecipient.DoesNotExist:
        logger.warning("[TASK] Recipient %s not found", recipient_id)
        return

    service = WhatsAppService()
    service.send_message(
        madrasah=recipient.madrasah,
        recipient=recipient,
        message_type=message_type,
        variables=variables,
        template_name=template_name,
    )


@shared_task
def process_pending_messages():
    """Retry failed messages and send pending ones."""
    from .models import WhatsAppMessage
    from .services import WhatsAppService

    pending = WhatsAppMessage.objects.filter(
        status__in=['pending', 'failed'],
        created_at__gte=timezone.now() - timedelta(hours=48),
    ).select_related('recipient', 'madrasah')[:50]

    service = WhatsAppService()
    sent = 0
    for msg in pending:
        success, result = service.api.send_text(msg.recipient.phone_number, msg.body)
        if success:
            msg.status = 'sent'
            msg.sent_at = timezone.now()
            if result:
                msg.whatsapp_message_id = result
            sent += 1
        else:
            msg.error_message = result
            msg.status = 'failed'
        msg.save(update_fields=['status', 'sent_at', 'whatsapp_message_id', 'error_message'])

    logger.info("[TASK] Processed %d pending messages, sent %d", len(pending), sent)
    return sent


@shared_task
def send_overdue_fee_reminders():
    """Send fee reminders for overdue fees to opted-in parents."""
    from school_ops.models import Fee
    from users.models import StudentParent, User
    from .models import WhatsAppRecipient
    from .services import WhatsAppService

    today = date.today()
    overdue_fees = Fee.objects.filter(
        status='overdue',
        due_date__lte=today,
    ).select_related('madrasah', 'student')

    service = WhatsAppService()
    sent = 0
    for fee in overdue_fees:
        parent_links = StudentParent.objects.filter(student=fee.student).select_related('parent')
        for link in parent_links:
            parent = link.parent
            try:
                recipient = WhatsAppRecipient.objects.get(
                    madrasah=fee.madrasah, parent=parent, is_opted_in=True,
                )
            except WhatsAppRecipient.DoesNotExist:
                continue

            msg = service.send_fee_reminder(
                fee.madrasah, parent, fee.student,
                fee.balance, fee.due_date,
            )
            if msg:
                sent += 1

    logger.info("[TASK] Sent %d fee reminders", sent)
    return sent


@shared_task
def send_daily_attendance_summary():
    """Send daily attendance summary to parents of absent/late students."""
    from school_ops.models import Attendance
    from users.models import StudentParent
    from .models import WhatsAppRecipient
    from .services import WhatsAppService

    today = date.today()
    absent_attendances = Attendance.objects.filter(
        date=today, status__in=['absent', 'late'],
    ).select_related('madrasah', 'student')

    service = WhatsAppService()
    sent = 0
    for att in absent_attendances:
        parent_links = StudentParent.objects.filter(student=att.student).select_related('parent')
        for link in parent_links:
            parent = link.parent
            try:
                recipient = WhatsAppRecipient.objects.get(
                    madrasah=att.madrasah, parent=parent, is_opted_in=True,
                )
            except WhatsAppRecipient.DoesNotExist:
                continue

            msg = service.send_attendance_alert(
                att.madrasah, parent, att.student,
                today, att.status,
            )
            if msg:
                sent += 1

    logger.info("[TASK] Sent %d attendance alerts", sent)
    return sent
