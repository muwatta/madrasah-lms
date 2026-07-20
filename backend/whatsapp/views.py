from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
import json
import logging

from .models import WhatsAppRecipient, WhatsAppMessage, WhatsAppTemplate
from .serializers import (
    WhatsAppRecipientSerializer,
    WhatsAppMessageSerializer,
    WhatsAppTemplateSerializer,
)
from .services import WhatsAppService

logger = logging.getLogger(__name__)


class WhatsAppRecipientViewSet(viewsets.ModelViewSet):
    serializer_class = WhatsAppRecipientSerializer

    def get_queryset(self):
        user = self.request.user
        qs = WhatsAppRecipient.objects.filter(madrasah=user.madrasah).select_related('parent')
        if user.role == 'parent':
            qs = qs.filter(parent=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)

    @action(detail=False, methods=['post'])
    def opt_in(self, request):
        phone_number = request.data.get('phone_number')
        language = request.data.get('language', 'ar')
        parent_id = request.data.get('parent_id')

        if not phone_number:
            return Response(
                {'error': 'phone_number is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from users.models import User
        if parent_id:
            try:
                parent = User.objects.get(pk=parent_id, role='parent', madrasah=request.user.madrasah)
            except User.DoesNotExist:
                return Response({'error': 'Parent not found'}, status=status.HTTP_404_NOT_FOUND)
        elif request.user.role == 'parent':
            parent = request.user
        else:
            return Response(
                {'error': 'parent_id is required for non-parent users'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        recipient, created = WhatsAppRecipient.objects.get_or_create(
            madrasah=request.user.madrasah,
            parent=parent,
            defaults={
                'phone_number': phone_number,
                'language': language,
            },
        )

        recipient.is_opted_in = True
        recipient.opted_in_at = timezone.now()
        recipient.opted_out_at = None
        recipient.phone_number = phone_number
        recipient.language = language
        recipient.save()

        return Response(WhatsAppRecipientSerializer(recipient).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def opt_out(self, request, pk=None):
        recipient = self.get_object()
        recipient.is_opted_in = False
        recipient.opted_out_at = timezone.now()
        recipient.save()
        return Response(WhatsAppRecipientSerializer(recipient).data)


class WhatsAppTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = WhatsAppTemplateSerializer

    def get_queryset(self):
        return WhatsAppTemplate.objects.filter(madrasah=self.request.user.madrasah)

    def perform_create(self, serializer):
        if self.request.user.role not in ('mudeer', 'idaarah'):
            raise PermissionDenied()
        serializer.save(madrasah=self.request.user.madrasah)

    def perform_update(self, serializer):
        if self.request.user.role not in ('mudeer', 'idaarah'):
            raise PermissionDenied()
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role not in ('mudeer', 'idaarah'):
            raise PermissionDenied()
        instance.delete()


class WhatsAppMessageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WhatsAppMessageSerializer

    def get_queryset(self):
        qs = WhatsAppMessage.objects.filter(madrasah=self.request.user.madrasah).select_related('recipient__parent')
        message_type = self.request.query_params.get('message_type')
        msg_status = self.request.query_params.get('status')
        recipient_id = self.request.query_params.get('recipient')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if message_type:
            qs = qs.filter(message_type=message_type)
        if msg_status:
            qs = qs.filter(status=msg_status)
        if recipient_id:
            qs = qs.filter(recipient_id=recipient_id)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        return qs


class SendMessageView(APIView):
    def post(self, request):
        if request.user.role not in ('mudeer', 'ustaadh'):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        parent_id = request.data.get('parent_id')
        message_type = request.data.get('message_type', 'general')
        body = request.data.get('body', '')
        template_name = request.data.get('template_name', '')

        if not parent_id:
            return Response({'error': 'parent_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        from users.models import User
        try:
            parent = User.objects.get(pk=parent_id, role='parent', madrasah=request.user.madrasah)
        except User.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=status.HTTP_404_NOT_FOUND)

        service = WhatsAppService()
        phone_number = request.data.get('phone_number', '')
        recipient = service._get_or_create_recipient(request.user.madrasah, parent, phone_number, request.data.get('language', 'ar'))

        variables = request.data.get('variables', {})
        variables['message'] = body
        if template_name:
            variables['_template_name'] = template_name

        msg = service.send_message(
            madrasah=request.user.madrasah,
            recipient=recipient,
            message_type=message_type,
            variables=variables,
            template_name=template_name or None,
            media_url=request.data.get('media_url', ''),
        )

        return Response(WhatsAppMessageSerializer(msg).data, status=status.HTTP_201_CREATED)


@csrf_exempt
def whatsapp_webhook(request):
    if request.method == 'GET':
        challenge = request.GET.get('hub.challenge', '')
        if challenge:
            return HttpResponse(challenge, content_type='text/plain')
        return HttpResponse('ok', content_type='text/plain')

    if request.method == 'POST':
        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return HttpResponse('bad json', status=400)

        messages = payload.get('messages', [])
        for msg_update in messages:
            wa_id = msg_update.get('id', '')
            new_status = msg_update.get('status', '')
            if wa_id:
                try:
                    msg = WhatsAppMessage.objects.get(whatsapp_message_id=wa_id)
                    msg.status = new_status
                    msg.save(update_fields=['status'])
                except WhatsAppMessage.DoesNotExist:
                    logger.warning("[WHATSAPP] Status update for unknown message: %s", wa_id)

        return HttpResponse('ok', content_type='text/plain')

    return HttpResponse('method not allowed', status=405)
