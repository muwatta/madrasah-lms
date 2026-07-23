from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
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
        try:
            data = json.loads(request.body)
            logger.info("[WHATSAPP] Webhook received: %s", json.dumps(data, indent=2))
        except json.JSONDecodeError:
            return HttpResponse("Bad JSON", status=400)

        return JsonResponse({"status": "ok"})

    return HttpResponse("Method not allowed", status=405)
