import io
import os
from django.conf import settings
from django.utils import timezone
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import mm, inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT_DIR = '/usr/share/fonts/truetype/dejavu/'

def _register_fonts():
    fonts = {
        'DejaVu': os.path.join(FONT_DIR, 'DejaVuSans.ttf'),
        'DejaVu-Bold': os.path.join(FONT_DIR, 'DejaVuSans-Bold.ttf'),
        'DejaVu-Mono': os.path.join(FONT_DIR, 'DejaVuSansMono.ttf'),
    }
    for name, path in fonts.items():
        if os.path.exists(path) and name not in pdfmetrics._fonts:
            try:
                pdfmetrics.registerFont(TTFont(name, path))
            except Exception:
                pass

GOLD = HexColor('#C5A047')
DARK_GREEN = HexColor('#006233')
LIGHT_GOLD = HexColor('#F5E6C8')

def generate_certificate(cert):
    _register_fonts()
    w, h = landscape(A4)
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=landscape(A4))

    outer_margin = 15 * mm
    inner_margin = 10 * mm

    c.setStrokeColor(GOLD)
    c.setLineWidth(3)
    c.rect(outer_margin, outer_margin, w - 2 * outer_margin, h - 2 * outer_margin)

    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    m2 = outer_margin + inner_margin
    c.rect(m2, m2, w - 2 * m2, h - 2 * m2)

    c.setFillColor(DARK_GREEN)
    c.rect(m2, h - m2 - 50 * mm, w - 2 * m2, 50 * mm, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont('DejaVu-Bold', 28) if 'DejaVu-Bold' in pdfmetrics._fonts else c.setFont('Helvetica-Bold', 28)
    c.drawCentredString(w / 2, h - m2 - 32 * mm, 'Certificate of Achievement')

    c.setFillColor(DARK_GREEN)
    c.setFont('DejaVu', 14)
    c.drawCentredString(w / 2, h - m2 - 68 * mm, 'This certificate is proudly awarded to')

    student_name = cert.student.get_full_name() or cert.student.email
    c.setFont('DejaVu-Bold', 24) if 'DejaVu-Bold' in pdfmetrics._fonts else c.setFont('Helvetica-Bold', 24)
    c.setFillColor(GOLD)
    c.drawCentredString(w / 2, h - m2 - 98 * mm, student_name)

    c.setFillColor(DARK_GREEN)
    c.setFont('DejaVu', 13)
    desc = cert.description or f'For completing: {cert.title}'
    c.drawCentredString(w / 2, h - m2 - 122 * mm, desc[:80])
    if len(desc) > 80:
        c.drawCentredString(w / 2, h - m2 - 140 * mm, desc[80:160])

    issued_date = cert.issued_at.strftime('%B %d, %Y') if cert.issued_at else timezone.now().strftime('%B %d, %Y')
    c.setFillColor(black)
    c.setFont('DejaVu', 11)
    c.drawCentredString(w / 2, m2 + 55 * mm, f'Issued: {issued_date}')
    c.drawCentredString(w / 2, m2 + 40 * mm, f'Certificate No: {cert.certificate_number}')

    if hasattr(cert, 'madrasah') and cert.madrasah:
        c.setFont('DejaVu', 10)
        c.drawCentredString(w / 2, m2 + 25 * mm, cert.madrasah.name)

    c.showPage()
    c.save()
    buf.seek(0)
    return buf
