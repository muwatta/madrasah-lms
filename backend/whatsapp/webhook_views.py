from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import hmac
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


@csrf_exempt
def whatsapp_webhook(request):
    if request.method == "GET":
        mode = request.GET.get("hub.mode")
        token = request.GET.get("hub.verify_token")
        challenge = request.GET.get("hub.challenge", "")

        if mode == "subscribe" and token == settings.WHATSAPP_VERIFY_TOKEN:
            logger.info("[WHATSAPP] Webhook verified successfully")
            return HttpResponse(challenge)

        logger.warning("[WHATSAPP] Verification failed: mode=%s, token=%s", mode, token)
        return HttpResponse("Verification failed", status=403)

    elif request.method == "POST":
        signature = request.META.get('HTTP_X_HUB_SIGNATURE_256', '')
        app_secret = settings.WHATSAPP_APP_SECRET
        if app_secret and not _verify_webhook_signature(request.body, signature, app_secret):
            logger.warning("[WHATSAPP] Invalid webhook signature")
            return HttpResponse("Invalid signature", status=403)

        try:
            data = json.loads(request.body)
            logger.info("[WHATSAPP] Webhook received: %s", json.dumps(data, indent=2))
        except json.JSONDecodeError:
            return HttpResponse("Bad JSON", status=400)

        return JsonResponse({"status": "ok"})

    return HttpResponse("Method not allowed", status=405)


def _verify_webhook_signature(body, signature_header, app_secret):
    """Verify the X-Hub-Signature-256 header from Meta."""
    if not signature_header:
        return False
    expected = 'sha256=' + hmac.new(
        app_secret.encode('utf-8'),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)
