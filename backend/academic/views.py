from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import (
    Session, Term, AcademicCalendar, ClassArm,
    Timetable, TimetableSlot,
)
from .serializers import (
    SessionSerializer, TermSerializer, AcademicCalendarSerializer,
    ClassArmSerializer, TimetableSerializer, TimetableDetailSerializer,
    TimetableSlotSerializer,
)


class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Session.objects.filter(madrasah=self.request.user.madrasah)

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class TermViewSet(viewsets.ModelViewSet):
    serializer_class = TermSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Term.objects.filter(madrasah=self.request.user.madrasah)

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class AcademicCalendarViewSet(viewsets.ModelViewSet):
    serializer_class = AcademicCalendarSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AcademicCalendar.objects.filter(madrasah=self.request.user.madrasah)

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class ClassArmViewSet(viewsets.ModelViewSet):
    serializer_class = ClassArmSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ClassArm.objects.filter(madrasah=self.request.user.madrasah)

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)


class TimetableViewSet(viewsets.ModelViewSet):
    serializer_class = TimetableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Timetable.objects.filter(madrasah=self.request.user.madrasah).prefetch_related('slots')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TimetableDetailSerializer
        return TimetableSerializer

    def perform_create(self, serializer):
        serializer.save(madrasah=self.request.user.madrasah)

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        timetable = self.get_object()
        if timetable.slots.exists():
            return Response(
                {'detail': 'Timetable already has slots. Clear them first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from curriculum.models import Enrollment
        subjects = Enrollment.objects.filter(
            school_class=timetable.school_class,
            madrasah=request.user.madrasah,
        ).values_list('subject', flat=True).distinct()

        slots_to_create = []
        for day in range(0, 7):
            for i, subject_id in enumerate(subjects):
                slots_to_create.append(TimetableSlot(
                    timetable=timetable,
                    day_of_week=day,
                    start_time=f"{8 + i}:00",
                    end_time=f"{8 + i + 1}:00",
                    subject_id=subject_id,
                ))

        TimetableSlot.objects.bulk_create(slots_to_create)
        return Response({'detail': f'Created {len(slots_to_create)} slots.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def slots(self, request, pk=None):
        timetable = self.get_object()
        slots = timetable.slots.select_related('subject', 'teacher').order_by('day_of_week', 'start_time')
        serializer = TimetableSlotSerializer(slots, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['put', 'patch'])
    def bulk(self, request, pk=None):
        timetable = self.get_object()
        slots_data = request.data.get('slots', [])

        timetable.slots.all().delete()

        slots_to_create = []
        for slot_data in slots_data:
            slots_to_create.append(TimetableSlot(
                timetable=timetable,
                day_of_week=slot_data['day_of_week'],
                start_time=slot_data['start_time'],
                end_time=slot_data['end_time'],
                subject_id=slot_data['subject'],
                teacher_id=slot_data.get('teacher'),
                room=slot_data.get('room', ''),
            ))

        TimetableSlot.objects.bulk_create(slots_to_create)
        return Response({'detail': f'Created {len(slots_to_create)} slots.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def detect_conflicts(self, request, pk=None):
        timetable = self.get_object()
        slots = timetable.slots.select_related('teacher').filter(teacher__isnull=False)

        conflicts = []
        for day in range(0, 7):
            day_slots = list(slots.filter(day_of_week=day).order_by('start_time'))
            for i in range(len(day_slots)):
                for j in range(i + 1, len(day_slots)):
                    s1, s2 = day_slots[i], day_slots[j]
                    if s1.teacher_id and s1.teacher_id == s2.teacher_id:
                        if s1.start_time < s2.end_time and s2.start_time < s1.end_time:
                            conflicts.append({
                                'teacher': s1.teacher.get_full_name(),
                                'day': s1.get_day_of_week_display(),
                                'slot1': f"{s1.start_time}-{s1.end_time} ({s1.subject})",
                                'slot2': f"{s2.start_time}-{s2.end_time} ({s2.subject})",
                            })

        return Response({'conflicts': conflicts, 'has_conflicts': len(conflicts) > 0})


class TimetableSlotViewSet(viewsets.ModelViewSet):
    serializer_class = TimetableSlotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        timetable_id = self.request.query_params.get('timetable')
        qs = TimetableSlot.objects.filter(
            timetable__madrasah=self.request.user.madrasah
        ).select_related('subject', 'teacher')
        if timetable_id:
            qs = qs.filter(timetable_id=timetable_id)
        return qs

    def perform_create(self, serializer):
        serializer.save()


from rest_framework.views import APIView
from curriculum.models import Enrollment
from lessons.models import Homework


class StudentTimetableView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enrollments = Enrollment.objects.filter(student=request.user, madrasah=request.user.madrasah)
        school_classes = enrollments.values_list('school_class', flat=True).distinct()
        timetables = Timetable.objects.filter(
            school_class__in=school_classes,
            madrasah=request.user.madrasah,
            is_active=True,
        )
        slots = TimetableSlot.objects.filter(timetable__in=timetables).select_related('subject', 'teacher').order_by('day_of_week', 'start_time')
        serializer = TimetableSlotSerializer(slots, many=True)
        return Response(serializer.data)


class TeacherTimetableView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        slots = TimetableSlot.objects.filter(
            teacher=request.user,
            timetable__madrasah=request.user.madrasah,
            timetable__is_active=True,
        ).select_related('subject', 'teacher').order_by('day_of_week', 'start_time')
        serializer = TimetableSlotSerializer(slots, many=True)
        return Response(serializer.data)


class StudentCalendarEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = AcademicCalendar.objects.filter(
            madrasah=request.user.madrasah,
        ).order_by('start_date')

        enrollments = Enrollment.objects.filter(student=request.user, madrasah=request.user.madrasah)
        school_classes = enrollments.values_list('school_class', flat=True).distinct()

        homework = Homework.objects.filter(
            school_class__in=school_classes,
            madrasah=request.user.madrasah,
            is_published=True,
        ).values('id', 'title', 'description', 'due_date', 'subject_name')

        event_data = AcademicCalendarSerializer(events, many=True).data
        homework_data = [
            {
                'id': h['id'],
                'title': h['title'],
                'description': h['description'],
                'start_date': h['due_date'],
                'end_date': h['due_date'],
                'event_type': 'homework',
                'subject_name': h['subject_name'],
            }
            for h in homework
        ]

        return Response({
            'events': event_data,
            'homework': homework_data,
        })
