import qrcode
import json
import hmac
import hashlib
from io import BytesIO
from datetime import timedelta
from django.utils import timezone
from django.conf import settings


class QRService:
    EXPIRY_MINUTES = 5

    def _get_secret(self):
        return settings.QR_SECRET_KEY

    def _compute_hmac(self, payload_str):
        return hmac.new(
            self._get_secret().encode(),
            payload_str.encode(),
            hashlib.sha256,
        ).hexdigest()

    def _build_payload(self, madrasah_id, student_id, class_id):
        now = timezone.now().isoformat()
        payload_str = f"1|{madrasah_id}|{student_id}|{class_id}|{now}"
        sig = self._compute_hmac(payload_str)
        return {
            "v": 1,
            "m": madrasah_id,
            "s": student_id,
            "c": class_id,
            "t": now,
            "h": sig,
        }

    def generate_class_qr(self, school_class, madrasah):
        payload = self._build_payload(madrasah.id, 0, school_class.id)
        return self._payload_to_png(payload), payload

    def generate_student_qr(self, student, madrasah, school_class=None):
        class_id = school_class.id if school_class else 0
        payload = self._build_payload(madrasah.id, student.id, class_id)
        return self._payload_to_png(payload), payload

    def _payload_to_png(self, payload):
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(json.dumps(payload, separators=(',', ':')))
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf

    def decode_qr_data(self, qr_data):
        if isinstance(qr_data, str):
            return json.loads(qr_data)
        return qr_data

    def verify_qr_data(self, qr_data):
        data = self.decode_qr_data(qr_data)

        if not all(k in data for k in ("v", "m", "s", "c", "t", "h")):
            return False, "Invalid QR data format"

        if data["v"] != 1:
            return False, "Unsupported QR version"

        payload_str = f"{data['v']}|{data['m']}|{data['s']}|{data['c']}|{data['t']}"
        expected_hmac = self._compute_hmac(payload_str)
        if not hmac.compare_digest(data["h"], expected_hmac):
            return False, "Invalid QR signature"

        qr_time = timezone.datetime.fromisoformat(data["t"])
        if qr_time.tzinfo is None:
            qr_time = timezone.make_aware(qr_time)
        if timezone.now() - qr_time > timedelta(minutes=self.EXPIRY_MINUTES):
            return False, "QR code has expired"

        return True, data
