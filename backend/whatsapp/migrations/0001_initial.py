# Generated migration for whatsapp models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='WhatsAppRecipient',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('phone_number', models.CharField(max_length=20)),
                ('is_opted_in', models.BooleanField(default=False)),
                ('opted_in_at', models.DateTimeField(blank=True, null=True)),
                ('opted_out_at', models.DateTimeField(blank=True, null=True)),
                ('language', models.CharField(choices=[('ar', 'Arabic'), ('en', 'English')], default='ar', max_length=5)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('madrasah', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='whatsapp_recipients', to='users.madrasah')),
                ('parent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='whatsapp_recipients', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('madrasah', 'parent')},
            },
        ),
        migrations.CreateModel(
            name='WhatsAppTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('message_type', models.CharField(choices=[('result', 'Result'), ('attendance', 'Attendance'), ('fee_reminder', 'Fee Reminder'), ('announcement', 'Announcement'), ('homework', 'Homework'), ('general', 'General')], max_length=20)),
                ('body_ar', models.TextField()),
                ('body_en', models.TextField()),
                ('variables', models.JSONField(default=list)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('madrasah', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='whatsapp_templates', to='users.madrasah')),
            ],
            options={
                'unique_together': {('madrasah', 'name')},
            },
        ),
        migrations.CreateModel(
            name='WhatsAppMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('message_type', models.CharField(choices=[('result', 'Result'), ('attendance', 'Attendance'), ('fee_reminder', 'Fee Reminder'), ('announcement', 'Announcement'), ('homework', 'Homework'), ('general', 'General')], max_length=20)),
                ('template_name', models.CharField(blank=True, max_length=100)),
                ('body', models.TextField()),
                ('media_url', models.URLField(blank=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('sent', 'Sent'), ('delivered', 'Delivered'), ('read', 'Read'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('whatsapp_message_id', models.CharField(blank=True, max_length=100)),
                ('error_message', models.TextField(blank=True)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('madrasah', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='whatsapp_messages', to='users.madrasah')),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='whatsapp.whatsapprecipient')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
