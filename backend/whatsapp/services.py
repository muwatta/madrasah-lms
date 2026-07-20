import json
import logging
from django.conf import settings
from django.utils import timezone
from .models import WhatsAppRecipient, WhatsAppMessage, WhatsAppTemplate

logger = logging.getLogger(__name__)


class TemplateRenderer:
    def render(self, template, variables, language='ar'):
        body = template.body_ar if language == 'ar' else template.body_en
        for key, value in variables.items():
            body = body.replace('{{' + key + '}}', str(value))
        return body


class WhatsAppCloudAPI:
    """Meta WhatsApp Cloud API client.

    Falls back to console logging when credentials are not configured.
    """

    BASE_URL = 'https://graph.facebook.com'

    def __init__(self):
        self.phone_number_id = settings.WHATSAPP_PHONE_NUMBER_ID
        self.access_token = settings.WHATSAPP_ACCESS_TOKEN
        self.api_version = settings.WHATSAPP_API_VERSION
        self._configured = bool(self.phone_number_id and self.access_token)

    def send_text(self, to_phone, body):
        """Send a plain text message via the Cloud API."""
        if not self._configured:
            logger.info("[WHATSAPP] Mock send to %s: %s", to_phone, body[:120])
            return True, ''

        url = f'{self.BASE_URL}/{self.api_version}/{self.phone_number_id}/messages'
        import requests
        try:
            resp = requests.post(
                url,
                headers={
                    'Authorization': f'Bearer {self.access_token}',
                    'Content-Type': 'application/json',
                },
                json={
                    'messaging_product': 'whatsapp',
                    'to': to_phone,
                    'type': 'text',
                    'text': {'body': body},
                },
                timeout=15,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                wa_id = data.get('messages', [{}])[0].get('id', '')
                return True, wa_id
            logger.error("[WHATSAPP] API error %s: %s", resp.status_code, resp.text)
            return False, resp.text
        except Exception as e:
            logger.error("[WHATSAPP] Request failed: %s", e)
            return False, str(e)

    def send_template(self, to_phone, template_name, language_code='en', components=None):
        """Send a pre-approved message template."""
        if not self._configured:
            logger.info("[WHATSAPP] Mock template '%s' to %s", template_name, to_phone[:8])
            return True, ''

        url = f'{self.BASE_URL}/{self.api_version}/{self.phone_number_id}/messages'
        body = {
            'messaging_product': 'whatsapp',
            'to': to_phone,
            'type': 'template',
            'template': {
                'name': template_name,
                'language': {'code': language_code},
            },
        }
        if components:
            body['template']['components'] = components

        import requests
        try:
            resp = requests.post(
                url,
                headers={
                    'Authorization': f'Bearer {self.access_token}',
                    'Content-Type': 'application/json',
                },
                json=body,
                timeout=15,
            )
            if resp.status_code in (200, 201):
                data = resp.json()
                wa_id = data.get('messages', [{}])[0].get('id', '')
                return True, wa_id
            logger.error("[WHATSAPP] Template error %s: %s", resp.status_code, resp.text)
            return False, resp.text
        except Exception as e:
            logger.error("[WHATSAPP] Template request failed: %s", e)
            return False, str(e)


class WhatsAppService:
    def __init__(self):
        self.renderer = TemplateRenderer()
        self.api = WhatsAppCloudAPI()

    def _get_or_create_recipient(self, madrasah, parent, phone_number, language='ar'):
        recipient, _ = WhatsAppRecipient.objects.get_or_create(
            madrasah=madrasah,
            parent=parent,
            defaults={
                'phone_number': phone_number,
                'language': language,
                'is_opted_in': True,
                'opted_in_at': timezone.now(),
            },
        )
        return recipient

    def send_message(self, madrasah, recipient, message_type, variables, template_name=None, media_url=None):
        template = None
        body = ''

        if template_name:
            try:
                template = WhatsAppTemplate.objects.get(
                    madrasah=madrasah, name=template_name, is_active=True,
                )
                body = self.renderer.render(template, variables, recipient.language)
            except WhatsAppTemplate.DoesNotExist:
                pass

        if not body and variables:
            body = str(variables.get('message', ''))
        if not body and variables:
            parts = [f'{k}: {v}' for k, v in variables.items() if not k.startswith('_')]
            if parts:
                body = ' | '.join(parts)

        msg = WhatsAppMessage.objects.create(
            madrasah=madrasah,
            recipient=recipient,
            message_type=message_type,
            template_name=template_name or '',
            body=body,
            media_url=media_url or '',
            status='pending',
        )

        success, result = self.api.send_text(recipient.phone_number, body)

        if success:
            msg.status = 'sent'
            msg.sent_at = timezone.now()
            if result:
                msg.whatsapp_message_id = result
        else:
            msg.status = 'failed'
            msg.error_message = result

        msg.save()
        return msg

    def send_bulk(self, recipients, message_type, variables_getter):
        results = []
        for recipient in recipients:
            variables = variables_getter(recipient)
            msg = self.send_message(
                madrasah=recipient.madrasah,
                recipient=recipient,
                message_type=message_type,
                variables=variables,
                template_name=variables.get('_template_name'),
            )
            results.append(msg)
        return results

    def send_result(self, madrasah, parent, student, subject_results):
        recipient = self._get_or_create_recipient(
            madrasah, parent,
            parent.phone_number if hasattr(parent, 'phone_number') else '',
        )
        if not recipient.is_opted_in:
            return None

        variables = {
            'student_name': student.get_full_name(),
            'subject': subject_results.get('subject', ''),
            'score': subject_results.get('score', ''),
            'total': subject_results.get('total', ''),
            '_template_name': 'result_notification',
        }
        return self.send_message(madrasah, recipient, 'result', variables, template_name='result_notification')

    def send_attendance_alert(self, madrasah, parent, student, date, status):
        recipient = self._get_or_create_recipient(
            madrasah, parent,
            parent.phone_number if hasattr(parent, 'phone_number') else '',
        )
        if not recipient.is_opted_in:
            return None

        variables = {
            'student_name': student.get_full_name(),
            'date': str(date),
            'status': status,
            '_template_name': 'attendance_alert',
        }
        return self.send_message(madrasah, recipient, 'attendance', variables, template_name='attendance_alert')

    def send_fee_reminder(self, madrasah, parent, student, amount, due_date):
        recipient = self._get_or_create_recipient(
            madrasah, parent,
            parent.phone_number if hasattr(parent, 'phone_number') else '',
        )
        if not recipient.is_opted_in:
            return None

        variables = {
            'student_name': student.get_full_name(),
            'amount': str(amount),
            'due_date': str(due_date),
            '_template_name': 'fee_reminder',
        }
        return self.send_message(madrasah, recipient, 'fee_reminder', variables, template_name='fee_reminder')
