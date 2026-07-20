from django.core.management.base import BaseCommand
from users.models import Madrasah
from whatsapp.models import WhatsAppTemplate

DEFAULT_TEMPLATES = [
    {
        'name': 'result_notification',
        'message_type': 'result',
        'body_ar': 'السلام عليكم {{student_name}}، نتيجة {{subject}}: {{score}}/{{total}}',
        'body_en': 'Assalamu Alaikum, {{student_name}}\'s result for {{subject}}: {{score}}/{{total}}',
        'variables': ['student_name', 'subject', 'score', 'total'],
    },
    {
        'name': 'attendance_alert',
        'message_type': 'attendance',
        'body_ar': 'السلام عليكم، {{student_name}} كان {{status}} اليوم {{date}}',
        'body_en': 'Assalamu Alaikum, {{student_name}} was {{status}} today ({{date}})',
        'variables': ['student_name', 'status', 'date'],
    },
    {
        'name': 'fee_reminder',
        'message_type': 'fee_reminder',
        'body_ar': 'تذكير برسوم {{student_name}}: المبلغ {{amount}}، مستحق في {{due_date}}',
        'body_en': 'Fee reminder for {{student_name}}: {{amount}} due by {{due_date}}',
        'variables': ['student_name', 'amount', 'due_date'],
    },
    {
        'name': 'general_announcement',
        'message_type': 'announcement',
        'body_ar': 'تنبيه: {{message}}',
        'body_en': 'Announcement: {{message}}',
        'variables': ['message'],
    },
    {
        'name': 'homework_notification',
        'message_type': 'homework',
        'body_ar': 'واجب جديد لـ {{student_name}} في {{subject}}: {{details}}',
        'body_en': 'New homework for {{student_name}} in {{subject}}: {{details}}',
        'variables': ['student_name', 'subject', 'details'],
    },
]


class Command(BaseCommand):
    help = 'Seed default WhatsApp message templates for all madaris'

    def handle(self, *args, **options):
        for madrasah in Madrasah.objects.all():
            for tmpl in DEFAULT_TEMPLATES:
                _, created = WhatsAppTemplate.objects.get_or_create(
                    madrasah=madrasah,
                    name=tmpl['name'],
                    defaults={
                        'message_type': tmpl['message_type'],
                        'body_ar': tmpl['body_ar'],
                        'body_en': tmpl['body_en'],
                        'variables': tmpl['variables'],
                    },
                )
                if created:
                    self.stdout.write(f'  Created template "{tmpl["name"]}" for {madrasah.name}')
        self.stdout.write(self.style.SUCCESS('Templates seeded successfully'))
