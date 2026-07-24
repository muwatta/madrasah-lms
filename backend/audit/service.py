import logging
from django.db import transaction
from django.contrib.contenttypes.models import ContentType

logger = logging.getLogger(__name__)


class AuditService:
    """Generic audit logger for any model mutation."""

    @staticmethod
    @transaction.atomic
    def log(
        actor=None,
        action='updated',
        instance=None,
        previous_data=None,
        new_data=None,
        reason='',
        ip_address=None,
        user_agent='',
    ):
        from .models import AuditLog

        if instance is None:
            return None

        ct = ContentType.objects.get_for_model(instance)
        model_name = f'{ct.app_label}.{ct.model}'
        object_id = str(instance.pk)
        object_repr = str(instance)[:300]

        # Extract only serializable fields from new_data
        if new_data is None:
            new_data = {}
        if previous_data is None:
            previous_data = {}

        madrasah = getattr(instance, 'madrasah', None)

        try:
            audit = AuditLog.objects.create(
                madrasah=madrasah,
                actor=actor,
                action=action,
                model_name=model_name,
                object_id=object_id,
                object_repr=object_repr,
                previous_data=previous_data,
                new_data=new_data,
                reason=reason,
                ip_address=ip_address,
                user_agent=user_agent,
            )
            return audit
        except Exception as e:
            logger.error("[AUDIT] Failed to log: %s", e)
            return None

    @staticmethod
    def get_field_diff(old_obj, new_obj, fields=None):
        """Compare two model instances and return a dict of changed fields."""
        if old_obj is None:
            return {}

        if fields is None:
            fields = [f.name for f in new_obj._meta.fields if f.name not in ('created_at', 'updated_at', 'marked_at')]

        changes = {}
        for field in fields:
            old_val = getattr(old_obj, field, None)
            new_val = getattr(new_obj, field, None)
            if old_val != new_val:
                changes[field] = {
                    'old': str(old_val) if old_val is not None else None,
                    'new': str(new_val) if new_val is not None else None,
                }
        return changes
