import logging
import resend
from django.conf import settings

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, html_body: str) -> bool:
    if not settings.RESEND_API_KEY:
        logger.info("[EMAIL] Mock send to %s | subject: %s", to, subject)
        logger.info("[EMAIL] Body: %s", html_body[:200])
        return True

    try:
        resend.api_key = settings.RESEND_API_KEY
        r = resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [to],
            'subject': subject,
            'html': html_body,
        })
        logger.info("[EMAIL] Sent to %s | id: %s", to, r.get('id'))
        return True
    except Exception as e:
        logger.error("[EMAIL] Failed to send to %s: %s", to, e)
        return False


def render_reset_email(reset_link: str, full_name: str) -> str:
    return f"""
<!DOCTYPE html>
<html dir="auto">
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f5f5f5;margin:0;padding:24px">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:12px;padding:32px">
    <h2 style="margin:0 0 8px;color:#1f2937">Reset Your Password</h2>
    <p style="color:#6b7280;line-height:1.6">Hi {full_name},</p>
    <p style="color:#6b7280;line-height:1.6">
      We received a request to reset your Madrasah LMS password.
      Click the button below to set a new one. This link expires in 1 hour.
    </p>
    <a href="{reset_link}"
       style="display:inline-block;margin:16px 0;padding:12px 24px;background:#10b981;color:white;text-decoration:none;border-radius:8px;font-weight:600">
      Reset Password
    </a>
    <p style="color:#9ca3af;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
  </div>
</body>
</html>"""


def render_verify_email(verify_link: str, full_name: str) -> str:
    return f"""
<!DOCTYPE html>
<html dir="auto">
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;background:#f5f5f5;margin:0;padding:24px">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:12px;padding:32px">
    <h2 style="margin:0 0 8px;color:#1f2937">Verify Your Email</h2>
    <p style="color:#6b7280;line-height:1.6">Hi {full_name},</p>
    <p style="color:#6b7280;line-height:1.6">
      Welcome to Madrasah LMS! Please verify your email address by clicking the button below.
    </p>
    <a href="{verify_link}"
       style="display:inline-block;margin:16px 0;padding:12px 24px;background:#10b981;color:white;text-decoration:none;border-radius:8px;font-weight:600">
      Verify Email
    </a>
    <p style="color:#9ca3af;font-size:13px">If you didn't create an account, you can safely ignore this email.</p>
  </div>
</body>
</html>"""
