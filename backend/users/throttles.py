from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle


class AuthAnonRateThrottle(AnonRateThrottle):
    rate = '10/hour'


class LandingAnonRateThrottle(ScopedRateThrottle):
    scope = 'landing'
