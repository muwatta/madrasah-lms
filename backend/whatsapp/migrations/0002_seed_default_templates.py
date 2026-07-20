from django.db import migrations


def create_default_templates(apps, schema_editor):
    WhatsAppTemplate = apps.get_model('whatsapp', 'WhatsAppTemplate')
    Madrasah = apps.get_model('users', 'Madrasah')

    for madrasah in Madrasah.objects.all():
        defaults = [
            {
                'name': 'result_notification',
                'message_type': 'result',
                'body_ar': '📚 نتائج {{student_name}}: {{subject}} = {{score}}. إجمالي {{total}}',
                'body_en': '📚 Results for {{student_name}}: {{subject}} = {{score}}. Total {{total}}',
                'variables': ['student_name', 'subject', 'score', 'total'],
            },
            {
                'name': 'fee_reminder',
                'message_type': 'fee_reminder',
                'body_ar': '💳 تذكير برسوم {{student_name}}: {{amount}} مستحقة في {{due_date}}',
                'body_en': '💳 Fee reminder for {{student_name}}: {{amount}} due on {{due_date}}',
                'variables': ['student_name', 'amount', 'due_date'],
            },
            {
                'name': 'attendance_alert',
                'message_type': 'attendance',
                'body_ar': '⚠️ غياب {{student_name}} يوم {{date}}',
                'body_en': '⚠️ {{student_name}} absent on {{date}}',
                'variables': ['student_name', 'date'],
            },
        ]
        for d in defaults:
            WhatsAppTemplate.objects.get_or_create(
                madrasah=madrasah,
                name=d['name'],
                defaults=d,
            )


def remove_default_templates(apps, schema_editor):
    WhatsAppTemplate = apps.get_model('whatsapp', 'WhatsAppTemplate')
    WhatsAppTemplate.objects.filter(name__in=[
        'result_notification', 'fee_reminder', 'attendance_alert',
    ]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('whatsapp', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_default_templates, remove_default_templates),
    ]
