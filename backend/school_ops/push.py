import json
import logging
from django.db import models
from django.conf import settings

logger = logging.getLogger(__name__)


class PushSubscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.URLField(max_length=500)
    p256dh = models.CharField(max_length=255, help_text='Base64url-encoded P-256 DH key')
    auth = models.CharField(max_length=255, help_text='Base64url-encoded auth secret')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'endpoint']

    def __str__(self):
        return f"PushSub: {self.user} ({self.endpoint[:50]}...)"


def send_push_notification(user, title, body, url=''):
    """Send a web push notification to all of a user's subscriptions."""
    try:
        from pywebpush import webpush, WebPushException

        subscriptions = PushSubscription.objects.filter(user=user)
        if not subscriptions.exists():
            return

        payload = json.dumps({
            'title': title,
            'body': body,
            'url': url,
        })

        vapid_private_key = getattr(settings, 'VAPID_PRIVATE_KEY', '')
        vapid_claims = {
            'sub': f'mailto:{settings.DEFAULT_FROM_EMAIL}',
        }

        failed = []
        for sub in subscriptions:
            try:
                webpush(
                    subscription_info={
                        'endpoint': sub.endpoint,
                        'keys': {
                            'p256dh': sub.p256dh,
                            'auth': sub.auth,
                        },
                    },
                    data=payload,
                    vapid_private_key=vapid_private_key,
                    vapid_claims=vapid_claims,
                )
            except WebPushException as e:
                logger.warning("[PUSH] Failed for %s: %s", user.email, e)
                # 404/410 = subscription expired, remove it
                if hasattr(e, 'response') and e.response is not None:
                    status = getattr(e.response, 'status_code', 0)
                    if status in (404, 410):
                        failed.append(sub.pk)
            except Exception as e:
                logger.error("[PUSH] Unexpected error for %s: %s", user.email, e)

        if failed:
            PushSubscription.objects.filter(pk__in=failed).delete()

    except ImportError:
        logger.warning("[PUSH] pywebpush not installed")
    except Exception as e:
        logger.error("[PUSH] send_push_notification failed: %s", e)
