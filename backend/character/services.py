from django.db.models import Avg, Count
from django.utils import timezone

from .models import CharacterTrait, CharacterEvaluation, CharacterScore


class CharacterService:
    def create_evaluation(self, madrasah, student, teacher, evaluation_date, term=None, scores=None, overall_notes=""):
        if not scores:
            raise ValueError("At least one score is required")

        evaluation = CharacterEvaluation.objects.create(
            madrasah=madrasah,
            student=student,
            teacher=teacher,
            evaluation_date=evaluation_date,
            term=term,
            overall_notes=overall_notes,
        )

        score_objs = []
        for s in scores:
            trait = CharacterTrait.objects.get(pk=s['trait_id'], madrasah=madrasah)
            score_objs.append(CharacterScore(
                evaluation=evaluation,
                trait=trait,
                score=s['score'],
                notes=s.get('notes', ''),
            ))
        CharacterScore.objects.bulk_create(score_objs)

        return evaluation

    def get_student_summary(self, student, term=None):
        evaluations = CharacterEvaluation.objects.filter(
            student=student,
        )
        if term:
            evaluations = evaluations.filter(term=term)

        trait_averages = (
            CharacterScore.objects
            .filter(evaluation__in=evaluations)
            .values('trait__id', 'trait__name', 'trait__name_ar', 'trait__category')
            .annotate(
                avg_score=Avg('score'),
                evaluation_count=Count('id'),
            )
            .order_by('trait__sort_order')
        )

        overall_avg = (
            CharacterScore.objects
            .filter(evaluation__in=evaluations)
            .aggregate(avg=Avg('score'))
        )

        return {
            'student_id': student.id,
            'student_name': student.get_full_name(),
            'total_evaluations': evaluations.count(),
            'overall_average': round(overall_avg['avg'], 2) if overall_avg['avg'] else None,
            'traits': [
                {
                    'trait_id': t['trait__id'],
                    'trait_name': t['trait__name'],
                    'trait_name_ar': t['trait__name_ar'],
                    'category': t['trait__category'],
                    'average_score': round(t['avg_score'], 2),
                    'evaluation_count': t['evaluation_count'],
                }
                for t in trait_averages
            ],
        }

    def get_class_summary(self, school_class, term=None):
        from curriculum.models import Enrollment

        students = Enrollment.objects.filter(
            school_class=school_class,
        ).values_list('student_id', flat=True)

        evaluations = CharacterEvaluation.objects.filter(
            student_id__in=students,
        )
        if term:
            evaluations = evaluations.filter(term=term)

        trait_averages = (
            CharacterScore.objects
            .filter(evaluation__in=evaluations)
            .values('trait__id', 'trait__name', 'trait__name_ar', 'trait__category')
            .annotate(avg_score=Avg('score'))
            .order_by('trait__sort_order')
        )

        student_avgs = (
            CharacterScore.objects
            .filter(evaluation__in=evaluations)
            .values('evaluation__student_id', 'evaluation__student__first_name', 'evaluation__student__last_name')
            .annotate(avg_score=Avg('score'))
            .order_by('-avg_score')
        )

        return {
            'class_id': school_class.id,
            'class_name': str(school_class),
            'student_count': len(students),
            'total_evaluations': evaluations.count(),
            'traits': [
                {
                    'trait_id': t['trait__id'],
                    'trait_name': t['trait__name'],
                    'trait_name_ar': t['trait__name_ar'],
                    'average_score': round(t['avg_score'], 2),
                }
                for t in trait_averages
            ],
            'students': [
                {
                    'student_id': s['evaluation__student_id'],
                    'student_name': f"{s['evaluation__student__first_name']} {s['evaluation__student__last_name']}",
                    'average_score': round(s['avg_score'], 2),
                }
                for s in student_avgs
            ],
        }
