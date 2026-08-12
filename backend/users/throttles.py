from rest_framework.throttling import AnonRateThrottle, ScopedRateThrottle


class AuthAnonRateThrottle(AnonRateThrottle):
    rate = '60/hour'


class LandingAnonRateThrottle(ScopedRateThrottle):
    scope = 'landing'
