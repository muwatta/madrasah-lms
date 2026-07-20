from django.contrib import admin
from .models import (
    Session, Term, AcademicCalendar, ClassArm,
    Timetable, TimetableSlot,
)

admin.site.register(Session)
admin.site.register(Term)
admin.site.register(AcademicCalendar)
admin.site.register(ClassArm)
admin.site.register(Timetable)
admin.site.register(TimetableSlot)
