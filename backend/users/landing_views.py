from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from users.models import User, Madrasah


@api_view(['GET'])
@permission_classes([AllowAny])
def landing_stats(request):
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
