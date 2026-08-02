"""Automatic prayer time calculation.

Pure-Python implementation of the standard astronomical algorithm used by
praytimes.org (defaults: Fajr 18°, Isha 17°, Asr shadow factor 1). Times are
returned in the madrasah's local clock time for the given date.
"""

import math
from datetime import date, datetime
from zoneinfo import ZoneInfo

DEG = math.pi / 180.0

FAJR_ANGLE = 18.0
ISHA_ANGLE = 17.0
SUNRISE_ANGLE = -0.833

CITY_LOCATIONS = {
    'lagos': (6.5244, 3.3792, 'Africa/Lagos'),
    'abuja': (9.0765, 7.3986, 'Africa/Lagos'),
    'ibadan': (7.3776, 3.9470, 'Africa/Lagos'),
    'kano': (12.0022, 8.5920, 'Africa/Lagos'),
    'cairo': (30.0444, 31.2357, 'Africa/Cairo'),
    'mecca': (21.4225, 39.8262, 'Asia/Riyadh'),
    'medina': (24.4672, 39.6111, 'Asia/Riyadh'),
    'riyadh': (24.7136, 46.6753, 'Asia/Riyadh'),
    'jeddah': (21.4858, 39.1925, 'Asia/Riyadh'),
    'london': (51.5074, -0.1278, 'Europe/London'),
    'new york': (40.7128, -74.0060, 'America/New_York'),
    'toronto': (43.6532, -79.3832, 'America/Toronto'),
    'dubai': (25.2048, 55.2708, 'Asia/Dubai'),
    'istanbul': (41.0082, 28.9784, 'Europe/Istanbul'),
    'karachi': (24.8607, 67.0011, 'Asia/Karachi'),
    'dakar': (14.7167, -17.4677, 'Africa/Dakar'),
}

DEFAULT_LOCATION = (21.4225, 39.8262, 'Asia/Riyadh')


def resolve_location(madrasah):
    """Return (latitude, longitude, timezone) for a madrasah.

    Uses explicit coordinates when set, otherwise falls back to the madrasah's
    city, and finally to a sensible default.
    """
    if madrasah.latitude is not None and madrasah.longitude is not None:
        return madrasah.latitude, madrasah.longitude, madrasah.timezone or 'UTC'
    city = (madrasah.city or '').strip().lower()
    if city in CITY_LOCATIONS:
        return CITY_LOCATIONS[city]
    return DEFAULT_LOCATION


def utc_offset_hours(timezone_name, day):
    """UTC offset (in hours) of `timezone_name` on `day` (handles DST)."""
    try:
        tz = ZoneInfo(timezone_name)
    except Exception:
        return 0.0
    dt = datetime(day.year, day.month, day.day, 12, tzinfo=tz)
    return dt.utcoffset().total_seconds() / 3600.0


def _fix_angle(angle):
    return angle - 360.0 * math.floor(angle / 360.0)


def _fix_hour(hour):
    return hour - 24.0 * math.floor(hour / 24.0)


def _julian(year, month, day):
    if month <= 2:
        year -= 1
        month += 12
    a = math.floor(year / 100.0)
    b = 2 - a + math.floor(a / 4.0)
    return (
        math.floor(365.25 * (year + 4716))
        + math.floor(30.6001 * (month + 1))
        + day
        + b
        - 1524.5
    )


def _sun_position(jd):
    """Return (declination in radians, equation of time in hours)."""
    d = jd - 2451545.0
    g = _fix_angle(357.529 + 0.98560028 * d)
    q = _fix_angle(280.459 + 0.98564736 * d)
    l = _fix_angle(q + 1.915 * math.sin(g * DEG) + 0.020 * math.sin(2 * g * DEG))
    e = 23.439 - 0.00000036 * d
    ra = math.atan2(math.cos(e * DEG) * math.sin(l * DEG), math.cos(l * DEG)) / DEG / 15.0
    eqt = q / 15.0 - _fix_hour(ra)
    decl = math.asin(math.sin(e * DEG) * math.sin(l * DEG))
    return decl, eqt


def _hour_angle(decl, lat, angle):
    """Time in hours from solar noon for a below-horizon sun angle.

    `angle` is the sun's altitude in degrees, negative below the horizon
    (e.g. -0.833 for sunrise/sunset) or a positive twilight angle (e.g. 18 for
    Fajr, which is treated as an equivalent below-horizon depression).
    """
    v = (-math.sin(angle * DEG) - math.sin(decl) * math.sin(lat * DEG)) / (
        math.cos(decl) * math.cos(lat * DEG)
    )
    v = max(-1.0, min(1.0, v))
    return math.acos(v) / DEG / 15.0


def _altitude_hour_angle(decl, lat, altitude):
    """Time in hours from solar noon when the sun is at a positive altitude."""
    v = (math.sin(altitude * DEG) - math.sin(decl) * math.sin(lat * DEG)) / (
        math.cos(decl) * math.cos(lat * DEG)
    )
    v = max(-1.0, min(1.0, v))
    return math.acos(v) / DEG / 15.0


def _asr_hour_angle(decl, lat, shadow_factor=1):
    phi = abs(lat * DEG - decl)
    tan_phi = math.tan(phi)
    altitude = math.atan(1.0 / (shadow_factor + tan_phi)) / DEG
    return _altitude_hour_angle(decl, lat, altitude)


def compute_prayer_times(day, latitude, longitude, utc_offset_hours):
    """Return {fajr, sunrise, dhuhr, asr, maghrib, isha} as 'HH:MM' strings.

    `day` is a date, `latitude`/`longitude` in degrees, `utc_offset_hours` the
    standard UTC offset (positive east) of the location on `day`.
    """
    jd = _julian(day.year, day.month, day.day)
    # Evaluate sun position near local solar noon for best accuracy.
    decl, eqt = _sun_position(jd + (12.0 - longitude / 15.0) / 24.0)

    def ast_to_clock(ast_hours):
        # Apparent solar time -> local clock time.
        return _fix_hour(ast_hours - longitude / 15.0 - eqt + utc_offset_hours)

    def fmt(hours):
        total_minutes = int(round(hours * 60)) % (24 * 60)
        return '%02d:%02d' % (total_minutes // 60, total_minutes % 60)

    sunrise_h = _hour_angle(decl, latitude, SUNRISE_ANGLE)
    fajr_h = _hour_angle(decl, latitude, FAJR_ANGLE)
    isha_h = _hour_angle(decl, latitude, ISHA_ANGLE)
    asr_h = _asr_hour_angle(decl, latitude, 1)

    return {
        'fajr': fmt(ast_to_clock(12 - fajr_h)),
        'sunrise': fmt(ast_to_clock(12 - sunrise_h)),
        'dhuhr': fmt(ast_to_clock(12)),
        'asr': fmt(ast_to_clock(12 + asr_h)),
        'maghrib': fmt(ast_to_clock(12 + sunrise_h)),
        'isha': fmt(ast_to_clock(12 + isha_h)),
    }
