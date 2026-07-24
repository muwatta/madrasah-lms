from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings

from .push import PushSubscription


class PushSubscribeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        endpoint = request.data.get('endpoint')
        p256dh = request.data.get('keys', {}).get('p256dh') if isinstance(request.data.get('keys'), dict) else request.data.get('p256dh')
        auth = request.data.get('keys', {}).get('auth') if isinstance(request.data.get('keys'), dict) else request.data.get('auth')

        if not all([endpoint, p256dh, auth]):
            return Response({'error': 'endpoint, p256dh, and auth are required'}, status=400)

        sub, created = PushSubscription.objects.update_or_create(
            user=request.user,
            endpoint=endpoint,
            defaults={'p256dh': p256dh, 'auth': auth},
        )

        return Response({'ok': True, 'created': created}, status=201 if created else 200)


class PushUnsubscribeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        endpoint = request.data.get('endpoint')
        if endpoint:
            PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        return Response({'ok': True})


class PushVapidPublicKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'publicKey': getattr(settings, 'VAPID_PUBLIC_KEY', ''),
        })
