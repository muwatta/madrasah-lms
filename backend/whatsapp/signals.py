import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender='school_ops.Notification')
def forward_notification_to_whatsapp(sender, instance, created, **kwargs):
    if not created:
        return

    # ── Web Push ──
    try:
        from school_ops.push import send_push_notification
        send_push_notification(
            user=instance.recipient,
            title=instance.title,
            body=instance.message or '',
            url=instance.link or '',
        )
    except Exception as e:
        logger.error("[SIGNAL] Push notification failed for %s: %s", instance.id, e)

    try:
        from .models import WhatsAppRecipient
        from .tasks import send_whatsapp_message

        recipient_type_map = {
            'attendance_absent': 'attendance',
            'attendance_late': 'attendance',
            'fee_overdue': 'fee_reminder',
            'announcement': 'announcement',
            'quiz_graded': 'result',
            'exam_result': 'result',
        }

        message_type = recipient_type_map.get(instance.notification_type, 'general')
        recipient = instance.recipient

        if recipient.role == 'student':
            parents = recipient.parent_links.select_related('parent')
            parent_list = [link.parent for link in parents]
        elif recipient.role == 'parent':
            parent_list = [recipient]
        else:
            return

        for parent in parent_list:
            wa_recipient = WhatsAppRecipient.objects.filter(
                madrasah=instance.madrasah,
                parent=parent,
                is_opted_in=True,
            ).first()
            if not wa_recipient:
                continue

            student_name = ''
            if recipient.role == 'student':
                student_name = recipient.get_full_name()
            else:
                student_name = instance.message.split(' was ')[0] if ' was ' in instance.message else ''

            variables = {
                'message': instance.title,
                'details': instance.message or '',
                'student_name': student_name,
            }

            send_whatsapp_message.delay(
                madrasah_id=instance.madrasah_id,
                recipient_id=wa_recipient.id,
                message_type=message_type,
                variables=variables,
            )

    except Exception as e:
        logger.error("[SIGNAL] Failed to forward notification %s: %s", instance.id, e)
