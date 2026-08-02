from datetime import date

import pytest

from quran.models import PrayerTimetable
from quran.prayer_calculator import compute_prayer_times, resolve_location


class TestPrayerCalculator:
    def test_compute_lagos(self):
        times = compute_prayer_times(date(2026, 8, 2), 6.5244, 3.3792, 1.0)
        assert times['dhuhr'] == '12:53'
        assert times['maghrib'] == '18:58'
        assert times['fajr'] == '05:28'
        # Times must be ordered and within a day.
        for key in ('sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'):
            assert times[key] > times['fajr']

    def test_compute_london_winter(self):
        times = compute_prayer_times(date(2026, 12, 21), 51.5074, -0.1278, 0.0)
        assert times['sunrise'] == '08:18'
        assert times['maghrib'] == '15:39'

    @pytest.mark.django_db
    def test_resolve_location_explicit_coords(self, madrasah):
        madrasah.latitude = 10.0
        madrasah.longitude = 20.0
        madrasah.timezone = 'Africa/Lagos'
        lat, lon, tz = resolve_location(madrasah)
        assert (lat, lon, tz) == (10.0, 20.0, 'Africa/Lagos')

    @pytest.mark.django_db
    def test_resolve_location_from_city(self, madrasah):
        lat, lon, tz = resolve_location(madrasah)
        assert (lat, lon, tz) == (6.5244, 3.3792, 'Africa/Lagos')


@pytest.mark.django_db
class TestGeneratePrayerTimes:
    def test_generate_requires_admin(self, client, student_client, teacher_client):
        url = '/api/v1/quran/prayer-times/generate/'
        assert client.post(url, {}, format='json').status_code in (401, 403)
        assert student_client.post(url, {}, format='json').status_code == 403
        assert teacher_client.post(url, {}, format='json').status_code == 403

    def test_generate_creates_month_rows(self, auth_client):
        url = '/api/v1/quran/prayer-times/generate/'
        res = auth_client.post(url, {'year': 2026, 'month': 8}, format='json')
        assert res.status_code == 200
        assert res.data['created'] == 31
        assert res.data['latitude'] == 6.5244
        assert res.data['timezone'] == 'Africa/Lagos'
        assert PrayerTimetable.objects.filter(date__month=8, date__year=2026).count() == 31

    def test_generate_invalid_month(self, auth_client):
        res = auth_client.post('/api/v1/quran/prayer-times/generate/', {'month': 13}, format='json')
        assert res.status_code == 400

    def test_generate_invalid_coordinates(self, auth_client):
        res = auth_client.post(
            '/api/v1/quran/prayer-times/generate/',
            {'year': 2026, 'month': 1, 'latitude': 'abc', 'longitude': 3.3},
            format='json',
        )
        assert res.status_code == 400

    def test_generate_saves_coordinates(self, auth_client, madrasah):
        res = auth_client.post(
            '/api/v1/quran/prayer-times/generate/',
            {'year': 2026, 'month': 1, 'latitude': 30.0, 'longitude': 31.2, 'timezone': 'Africa/Cairo'},
            format='json',
        )
        assert res.status_code == 200
        madrasah.refresh_from_db()
        assert madrasah.latitude == 30.0
        assert madrasah.longitude == 31.2
        assert madrasah.timezone == 'Africa/Cairo'

    def test_today_requires_rows(self, auth_client):
        res = auth_client.get('/api/v1/quran/prayer-times/today/')
        assert res.status_code == 404

    def test_today_after_generate(self, auth_client):
        from datetime import date as d
        PrayerTimetable.objects.create(
            madrasah=auth_client.handler._force_user.madrasah,
            date=d.today(), fajr='05:00', sunrise='06:00', dhuhr='12:00',
            asr='15:00', maghrib='18:00', isha='19:00',
        )
        res = auth_client.get('/api/v1/quran/prayer-times/today/')
        assert res.status_code == 200
        assert res.data['dhuhr'] == '12:00'

    def test_settings_endpoint(self, auth_client, madrasah):
        res = auth_client.get('/api/v1/quran/prayer-times/settings/')
        assert res.status_code == 200
        assert res.data['city'] == 'Lagos'
