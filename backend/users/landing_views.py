from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.http import Http404
from users.models import User, Madrasah
from .throttles import LandingAnonRateThrottle


@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([LandingAnonRateThrottle])
def landing_stats(request):
    if not settings.PUBLIC_STATS_ENABLED:
        raise Http404

    total_students = User.objects.filter(role='student').count()
    total_teachers = User.objects.filter(role='ustaadh').count()
    total_madaris = Madrasah.objects.count()
    total_graduates = total_students  # placeholder
    return Response({
        'students': total_students,
        'teachers': total_teachers,
        'schools': total_madaris,
        'graduates': total_graduates,
    })
