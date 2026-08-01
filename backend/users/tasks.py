from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from .models import RefreshToken


@shared_task
def purge_expired_refresh_tokens():
    cutoff = timezone.now() - timedelta(days=30)
    deleted, _ = RefreshToken.objects.filter(expires_at__lt=cutoff).delete()
    return deleted
