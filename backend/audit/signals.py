import json
import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import Signal, receiver
from django.contrib.auth.signals import user_logged_in

logger = logging.getLogger(__name__)

# Track pre-save snapshots
_pre_save_cache = {}


def _snapshot_fields(instance, fields=None):
    """Capture field values before save for diffing."""
    if fields is None:
        fields = [f.name for f in instance._meta.fields
                  if f.name not in ('created_at', 'updated_at', 'marked_at', 'scanned_at')]
    return {f: str(getattr(instance, f, None)) for f in fields}


# ─── Results ────────────────────────────────────────────────────────────────

@receiver(pre_save, sender='results.SubjectResult')
def subjectresult_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            _pre_save_cache[('subjectresult', instance.pk)] = _snapshot_fields(old)
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender='results.SubjectResult')
def subjectresult_post_save(sender, instance, created, **kwargs):
    from audit.service import AuditService
    key = ('subjectresult', instance.pk)
    action = 'created' if created else 'updated'
    prev = _pre_save_cache.pop(key, {})
    new = _snapshot_fields(instance)
    if created or prev != new:
        AuditService.log(
            actor=getattr(instance, '_audit_actor', None),
            action=action,
            instance=instance,
            previous_data=prev,
            new_data=new if not created else {},
        )


@receiver(pre_save, sender='results.TermResult')
def termresult_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            _pre_save_cache[('termresult', instance.pk)] = _snapshot_fields(old)
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender='results.TermResult')
def termresult_post_save(sender, instance, created, **kwargs):
    from audit.service import AuditService
    key = ('termresult', instance.pk)
    action = 'created' if created else 'updated'
    prev = _pre_save_cache.pop(key, {})
    new = _snapshot_fields(instance)
    if created or prev != new:
        AuditService.log(
            actor=getattr(instance, '_audit_actor', None),
            action=action,
            instance=instance,
            previous_data=prev,
            new_data=new if not created else {},
        )


# ─── Attendance ─────────────────────────────────────────────────────────────

@receiver(pre_save, sender='school_ops.Attendance')
def attendance_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            _pre_save_cache[('attendance', instance.pk)] = _snapshot_fields(old)
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender='school_ops.Attendance')
def attendance_post_save(sender, instance, created, **kwargs):
    from audit.service import AuditService
    key = ('attendance', instance.pk)
    action = 'created' if created else 'updated'
    prev = _pre_save_cache.pop(key, {})
    new = _snapshot_fields(instance)
    if created or prev != new:
        AuditService.log(
            actor=getattr(instance, '_audit_actor', None) or getattr(instance, 'marked_by', None),
            action=action,
            instance=instance,
            previous_data=prev,
            new_data=new if not created else {},
        )


# ─── Fees ───────────────────────────────────────────────────────────────────

@receiver(pre_save, sender='school_ops.Fee')
def fee_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            _pre_save_cache[('fee', instance.pk)] = _snapshot_fields(old)
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender='school_ops.Fee')
def fee_post_save(sender, instance, created, **kwargs):
    from audit.service import AuditService
    key = ('fee', instance.pk)
    action = 'created' if created else 'updated'
    prev = _pre_save_cache.pop(key, {})
    new = _snapshot_fields(instance)
    if created or prev != new:
        AuditService.log(
            actor=getattr(instance, '_audit_actor', None),
            action=action,
            instance=instance,
            previous_data=prev,
            new_data=new if not created else {},
        )


@receiver(post_save, sender='school_ops.FeePayment')
def feepayment_post_save(sender, instance, created, **kwargs):
    if created:
        from audit.service import AuditService
        AuditService.log(
            actor=getattr(instance, '_audit_actor', None) or getattr(instance, 'recorded_by', None),
            action='payment_made',
            instance=instance,
            new_data={
                'amount_paid': str(instance.amount_paid),
                'payment_method': instance.payment_method,
                'fee_id': instance.fee_id,
            },
        )


# ─── Users ──────────────────────────────────────────────────────────────────

@receiver(pre_save, sender='users.User')
def user_pre_save(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = sender.objects.get(pk=instance.pk)
            _pre_save_cache[('user', instance.pk)] = _snapshot_fields(old)
        except sender.DoesNotExist:
            pass


@receiver(post_save, sender='users.User')
def user_post_save(sender, instance, created, **kwargs):
    from audit.service import AuditService
    key = ('user', instance.pk)
    action = 'created' if created else 'updated'
    prev = _pre_save_cache.pop(key, {})
    new = _snapshot_fields(instance)
    # Exclude password hash from logs
    prev.pop('password', None)
    new.pop('password', None)
    if created or prev != new:
        AuditService.log(
            actor=getattr(instance, '_audit_actor', None),
            action=action,
            instance=instance,
            previous_data=prev,
            new_data=new if not created else {},
        )


# ─── Login ──────────────────────────────────────────────────────────────────

@receiver(user_logged_in)
def user_login_audit(sender, request, user, **kwargs):
    from audit.service import AuditService
    ip = None
    ua = ''
    if request:
        ip = _get_ip(request)
        ua = request.META.get('HTTP_USER_AGENT', '')[:300]
    AuditService.log(
        actor=user,
        action='login',
        instance=user,
        new_data={'email': user.email},
        ip_address=ip,
        user_agent=ua,
    )


def _get_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
