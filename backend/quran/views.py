from datetime import date
from django.utils import timezone
from django.db.models import Count, Avg, Sum, Q
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import MemorizationTracker, RevisionSchedule, TajwidAssessment, PrayerTimetable
from .serializers import (
    MemorizationTrackerSerializer,
    RevisionScheduleSerializer,
    TajwidAssessmentSerializer,
    PrayerTimetableSerializer,
)


class MemorizationTrackerListCreateView(generics.ListCreateAPIView):
    serializer_class = MemorizationTrackerSerializer

    def get_queryset(self):
        qs = MemorizationTracker.objects.filter(
            madrasah=self.request.user.madrasah
        ).select_related('student', 'teacher')
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        elif self.request.user.role == 'student':
            qs = qs.filter(student=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class MemorizationTrackerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MemorizationTrackerSerializer

    def get_queryset(self):
        qs = MemorizationTracker.objects.filter(
            madrasah=self.request.user.madrasah
        ).select_related('student', 'teacher')
        if self.request.user.role == 'student':
            qs = qs.filter(student=self.request.user)
        return qs


class RevisionScheduleListCreateView(generics.ListCreateAPIView):
    serializer_class = RevisionScheduleSerializer

    def get_queryset(self):
        qs = RevisionSchedule.objects.filter(
            madrasah=self.request.user.madrasah
        ).select_related('student')
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        elif self.request.user.role == 'student':
            qs = qs.filter(student=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class RevisionScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RevisionScheduleSerializer

    def get_queryset(self):
        qs = RevisionSchedule.objects.filter(
            madrasah=self.request.user.madrasah
        ).select_related('student')
        if self.request.user.role == 'student':
            qs = qs.filter(student=self.request.user)
        return qs


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def mark_revision_complete(request, pk):
    try:
        revision = RevisionSchedule.objects.get(pk=pk, madrasah=request.user.madrasah)
    except RevisionSchedule.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = RevisionScheduleSerializer(revision, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save(completed=True, completed_at=timezone.now())
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TajwidAssessmentListCreateView(generics.ListCreateAPIView):
    serializer_class = TajwidAssessmentSerializer

    def get_queryset(self):
        qs = TajwidAssessment.objects.filter(
            madrasah=self.request.user.madrasah
        ).select_related('student', 'teacher')
        student_id = self.request.query_params.get('student')
        if student_id:
            qs = qs.filter(student_id=student_id)
        elif self.request.user.role == 'student':
            qs = qs.filter(student=self.request.user)
        return qs

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class TajwidAssessmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TajwidAssessmentSerializer

    def get_queryset(self):
        qs = TajwidAssessment.objects.filter(
            madrasah=self.request.user.madrasah
        ).select_related('student', 'teacher')
        if self.request.user.role == 'student':
            qs = qs.filter(student=self.request.user)
        return qs


class PrayerTimetableListCreateView(generics.ListCreateAPIView):
    serializer_class = PrayerTimetableSerializer

    def get_queryset(self):
        return PrayerTimetable.objects.filter(madrasah=self.request.user.madrasah)

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class PrayerTimetableDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PrayerTimetableSerializer

    def get_queryset(self):
        return PrayerTimetable.objects.filter(madrasah=self.request.user.madrasah)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_prayer_times(request):
    timetable = PrayerTimetable.objects.filter(
        madrasah=request.user.madrasah, date=date.today()
    ).first()
    if not timetable:
        return Response({'detail': 'No prayer timetable for today.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = PrayerTimetableSerializer(timetable)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_progress(request, student_id):
    madrasah = request.user.madrasah

    # If student, can only view own progress
    if request.user.role == 'student' and request.user.pk != int(student_id):
        return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

    mem_qs = MemorizationTracker.objects.filter(madrasah=madrasah, student_id=student_id)
    rev_qs = RevisionSchedule.objects.filter(madrasah=madrasah, student_id=student_id)
    taj_qs = TajwidAssessment.objects.filter(madrasah=madrasah, student_id=student_id)

    total_surahs = mem_qs.values('surah_number').distinct().count()
    total_ayahs = mem_qs.aggregate(total=Sum('ayah_end') - Sum('ayah_start') + Count('id'))['total'] or 0
    # More accurate ayah count
    ayah_data = mem_qs.values_list('ayah_start', 'ayah_end')
    total_ayahs = sum(end - start + 1 for start, end in ayah_data)

    recent_scores = list(mem_qs.order_by('-memorization_date')[:5].values_list('score', flat=True))
    avg_memorization_score = mem_qs.aggregate(avg=Avg('score'))['avg']
    avg_tajwid_score = taj_qs.aggregate(avg=Avg('overall_score'))['avg']

    upcoming_revisions = RevisionScheduleSerializer(
        rev_qs.filter(completed=False, revision_date__gte=date.today()).order_by('revision_date')[:10],
        many=True,
    ).data

    return Response({
        'student_id': student_id,
        'total_surahs_memorized': total_surahs,
        'total_ayahs_memorized': total_ayahs,
        'recent_scores': recent_scores,
        'average_memorization_score': round(avg_memorization_score, 1) if avg_memorization_score else None,
        'average_tajwid_score': round(avg_tajwid_score, 1) if avg_tajwid_score else None,
        'upcoming_revisions': upcoming_revisions,
    })
