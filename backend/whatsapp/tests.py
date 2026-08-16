import json
from django.test import TestCase, Client
from django.utils import timezone
from rest_framework.test import APIClient

from users.models import User, Madrasah
from .models import WhatsAppRecipient, WhatsAppMessage, WhatsAppTemplate
from .services import WhatsAppService, TemplateRenderer


class WhatsAppRecipientModelTest(TestCase):
    def setUp(self):
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.parent = User.objects.create_user(
            email='parent@test.com', password='pass123',
            first_name='Ali', last_name='Hassan', role='parent', madrasah=self.madrasah,
        )

    def test_opt_in_opt_out(self):
        recipient = WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=self.parent,
            phone_number='+1234567890', is_opted_in=True, opted_in_at=timezone.now(),
        )
        self.assertTrue(recipient.is_opted_in)

        recipient.is_opted_in = False
        recipient.opted_out_at = timezone.now()
        recipient.save()
        recipient.refresh_from_db()
        self.assertFalse(recipient.is_opted_in)

    def test_unique_together(self):
        WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=self.parent, phone_number='+1234567890',
        )
        with self.assertRaises(Exception):
            WhatsAppRecipient.objects.create(
                madrasah=self.madrasah, parent=self.parent, phone_number='+9999999999',
            )

    def test_str(self):
        r = WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=self.parent, phone_number='+1234567890',
        )
        self.assertIn('Ali', str(r))
        self.assertIn('+1234567890', str(r))


class TemplateRendererTest(TestCase):
    def setUp(self):
        self.renderer = TemplateRenderer()

    def test_render_arabic(self):
        template = type('T', (), {'body_ar': 'مرحبا {{name}}', 'body_en': 'Hello {{name}}'})()
        result = self.renderer.render(template, {'name': 'أحمد'}, 'ar')
        self.assertEqual(result, 'مرحبا أحمد')

    def test_render_english(self):
        template = type('T', (), {'body_ar': 'مرحبا {{name}}', 'body_en': 'Hello {{name}}'})()
        result = self.renderer.render(template, {'name': 'Ahmed'}, 'en')
        self.assertEqual(result, 'Hello Ahmed')

    def test_render_multiple_vars(self):
        template = type('T', (), {'body_ar': '{{student}} - {{score}}', 'body_en': ''})()
        result = self.renderer.render(template, {'student': 'Ali', 'score': '95'}, 'ar')
        self.assertEqual(result, 'Ali - 95')


class WhatsAppServiceTest(TestCase):
    def setUp(self):
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.parent = User.objects.create_user(
            email='parent@test.com', password='pass123',
            first_name='Ali', last_name='Hassan', role='parent', madrasah=self.madrasah,
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass123',
            first_name='Omar', last_name='Ali', role='student', madrasah=self.madrasah,
        )
        self.service = WhatsAppService()

    def test_send_message_creates_record(self):
        recipient = WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=self.parent,
            phone_number='+1234567890', is_opted_in=True,
        )
        msg = self.service.send_message(
            madrasah=self.madrasah,
            recipient=recipient,
            message_type='general',
            variables={'message': 'Test body'},
        )
        self.assertEqual(msg.status, 'sent')
        self.assertEqual(msg.body, 'Test body')
        self.assertIsNotNone(msg.sent_at)

    def test_send_result(self):
        msg = self.service.send_result(
            self.madrasah, self.parent, self.student,
            {'subject': 'Quran', 'score': '95', 'total': '100'},
        )
        self.assertIsNotNone(msg)
        self.assertEqual(msg.message_type, 'result')
        self.assertIn('Omar', msg.body)

    def test_send_attendance_alert(self):
        msg = self.service.send_attendance_alert(
            self.madrasah, self.parent, self.student,
            '2026-07-20', 'absent',
        )
        self.assertIsNotNone(msg)
        self.assertEqual(msg.message_type, 'attendance')

    def test_send_fee_reminder(self):
        msg = self.service.send_fee_reminder(
            self.madrasah, self.parent, self.student,
            '5000', '2026-08-01',
        )
        self.assertIsNotNone(msg)
        self.assertEqual(msg.message_type, 'fee_reminder')

    def test_does_not_send_to_unsubscribed(self):
        WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=self.parent,
            phone_number='+1234567890', is_opted_in=False,
        )
        msg = self.service.send_result(
            self.madrasah, self.parent, self.student,
            {'subject': 'Quran', 'score': '95', 'total': '100'},
        )
        self.assertIsNone(msg)

    def test_send_with_template(self):
        WhatsAppTemplate.objects.create(
            madrasah=self.madrasah, name='test_tmpl',
            message_type='general', body_ar='مرحبا {{name}}', body_en='Hello {{name}}',
            variables=['name'],
        )
        recipient = WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=self.parent,
            phone_number='+1234567890', is_opted_in=True, language='ar',
        )
        msg = self.service.send_message(
            self.madrasah, recipient, 'general', {'name': 'Ali'}, template_name='test_tmpl',
        )
        self.assertEqual(msg.body, 'مرحبا Ali')
        self.assertEqual(msg.template_name, 'test_tmpl')

    def test_send_bulk(self):
        r1 = WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=self.parent,
            phone_number='+1111111111', is_opted_in=True,
        )
        p2 = User.objects.create_user(
            email='p2@test.com', password='pass123',
            first_name='B', last_name='C', role='parent', madrasah=self.madrasah,
        )
        r2 = WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=p2,
            phone_number='+2222222222', is_opted_in=True,
        )
        results = self.service.send_bulk(
            [r1, r2], 'general',
            lambda r: {'message': f'Hi {r.parent.first_name}'},
        )
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].status, 'sent')


class WhatsAppAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.admin = User.objects.create_user(
            email='admin@test.com', password='pass123',
            first_name='Admin', last_name='User', role='mudeer', madrasah=self.madrasah,
        )
        self.parent_user = User.objects.create_user(
            email='parent@test.com', password='pass123',
            first_name='Ali', last_name='Hassan', role='parent', madrasah=self.madrasah,
        )
        self.client.force_authenticate(user=self.admin)

    def test_opt_in(self):
        resp = self.client.post('/api/v1/whatsapp/recipients/opt_in/', {
            'parent_id': self.parent_user.pk,
            'phone_number': '+1234567890',
            'language': 'ar',
        })
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data['is_opted_in'])

    def test_opt_out(self):
        r = WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=self.parent_user,
            phone_number='+1234567890', is_opted_in=True,
        )
        resp = self.client.post(f'/api/v1/whatsapp/recipients/{r.pk}/opt_out/')
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data['is_opted_in'])

    def test_parent_cannot_manage_templates(self):
        self.client.force_authenticate(user=self.parent_user)
        resp = self.client.post('/api/v1/whatsapp/templates/', {
            'name': 'test',
            'message_type': 'general',
            'body_ar': 'test',
            'body_en': 'test',
        })
        self.assertEqual(resp.status_code, 403)

    def test_template_crud(self):
        resp = self.client.post('/api/v1/whatsapp/templates/', {
            'name': 'my_template',
            'message_type': 'fee_reminder',
            'body_ar': 'رسوم {{student_name}}',
            'body_en': 'Fees for {{student_name}}',
            'variables': ['student_name'],
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        tid = resp.data['id']

        resp = self.client.get('/api/v1/whatsapp/templates/')
        self.assertEqual(resp.status_code, 200)

        resp = self.client.put(f'/api/v1/whatsapp/templates/{tid}/', {
            'name': 'my_template',
            'message_type': 'fee_reminder',
            'body_ar': 'رسوم {{student_name}} - محدث',
            'body_en': 'Fees for {{student_name}} - updated',
            'variables': ['student_name'],
            'is_active': False,
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.data['is_active'])

        resp = self.client.delete(f'/api/v1/whatsapp/templates/{tid}/')
        self.assertEqual(resp.status_code, 204)

    def test_send_message(self):
        resp = self.client.post('/api/v1/whatsapp/send/', {
            'parent_id': self.parent_user.pk,
            'message_type': 'general',
            'body': 'Test message',
            'phone_number': '+1234567890',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['status'], 'sent')

    def test_message_list(self):
        r = WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=self.parent_user,
            phone_number='+1234567890', is_opted_in=True,
        )
        WhatsAppMessage.objects.create(
            madrasah=self.madrasah, recipient=r, message_type='general',
            body='test', status='sent', sent_at=timezone.now(),
        )
        resp = self.client.get('/api/v1/whatsapp/messages/')
        self.assertEqual(resp.status_code, 200)

    def test_webhook_verification(self):
        from django.conf import settings
        self.client2 = Client()
        resp = self.client2.get(
            f'/api/v1/whatsapp/webhook/?hub.mode=subscribe&hub.verify_token={settings.WHATSAPP_WEBHOOK_VERIFY_TOKEN}&hub.challenge=abc123'
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.content, b'abc123')

    def _sign_webhook(self, body):
        import hashlib, hmac
        from django.conf import settings
        sig = hmac.new(
            settings.WHATSAPP_ACCESS_TOKEN.encode('utf-8'),
            body,
            hashlib.sha256,
        ).hexdigest()
        return f'sha256={sig}'

    def test_webhook_status_update(self):
        r = WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=self.parent_user,
            phone_number='+1234567890', is_opted_in=True,
        )
        msg = WhatsAppMessage.objects.create(
            madrasah=self.madrasah, recipient=r, message_type='general',
            body='test', status='sent', whatsapp_message_id='wa_msg_123',
        )

        payload = {
            'entry': [{
                'changes': [{
                    'value': {
                        'statuses': [{'id': 'wa_msg_123', 'status': 'delivered'}],
                    }
                }]
            }]
        }
        body = json.dumps(payload).encode('utf-8')
        self.client2 = Client()
        resp = self.client2.post(
            '/api/v1/whatsapp/webhook/',
            data=body,
            content_type='application/json',
            HTTP_X_HUB_SIGNATURE_256=self._sign_webhook(body),
        )
        self.assertEqual(resp.status_code, 200)
        msg.refresh_from_db()
        self.assertEqual(msg.status, 'delivered')


class WhatsAppRecipientGuardTests(TestCase):
    """Recipients are full CRUD for admins, self-scoped for parents, denied for others."""

    def setUp(self):
        self.client = APIClient()
        self.madrasah = Madrasah.objects.create(name='Test Madrasah')
        self.mudeer = User.objects.create_user(
            email='mudeer@test.com', password='pass123',
            first_name='M', last_name='A', role='mudeer', madrasah=self.madrasah,
        )
        self.parent = User.objects.create_user(
            email='parent@test.com', password='pass123',
            first_name='P', last_name='A', role='parent', madrasah=self.madrasah,
        )
        self.student = User.objects.create_user(
            email='student@test.com', password='pass123',
            first_name='S', last_name='T', role='student', madrasah=self.madrasah,
        )
        self.recipient = WhatsAppRecipient.objects.create(
            madrasah=self.madrasah, parent=self.parent, phone_number='+1234567890',
        )

    def test_parent_cannot_forge_is_opted_in(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.patch(
            f'/api/v1/whatsapp/recipients/{self.recipient.pk}/',
            {'is_opted_in': True, 'phone_number': '+1111111111'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.recipient.refresh_from_db()
        self.assertFalse(self.recipient.is_opted_in)

    def test_student_cannot_create_recipient(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            '/api/v1/whatsapp/recipients/',
            {'parent': self.parent.pk, 'phone_number': '+1234567890'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_parent_cannot_create_recipient_for_other_parent(self):
        self.client.force_authenticate(user=self.parent)
        response = self.client.post(
            '/api/v1/whatsapp/recipients/',
            {'parent': self.mudeer.pk, 'phone_number': '+1234567890'},
            format='json',
        )
        self.assertEqual(response.status_code, 403)

    def test_student_cannot_delete_recipient(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.delete(f'/api/v1/whatsapp/recipients/{self.recipient.pk}/')
        self.assertEqual(response.status_code, 403)
        self.assertTrue(WhatsAppRecipient.objects.filter(pk=self.recipient.pk).exists())

    def test_mudeer_can_manage_recipients(self):
        self.client.force_authenticate(user=self.mudeer)
        response = self.client.patch(
            f'/api/v1/whatsapp/recipients/{self.recipient.pk}/',
            {'phone_number': '+9999999999'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.recipient.refresh_from_db()
        self.assertEqual(self.recipient.phone_number, '+9999999999')
