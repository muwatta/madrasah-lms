from django.db import models
from django.core.exceptions import ValidationError
from users.models import User, Madrasah

COMPONENT_TYPES = [
    ('assignment', 'Assignment'),
    ('test', 'Test'),
    ('exam', 'Exam'),
]

TERM_RESULT_STATUS = [
    ('draft', 'Draft'),
    ('submitted', 'Submitted'),
    ('published', 'Published'),
]


class Exam(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='exams')
    subject = models.ForeignKey('curriculum.Subject', on_delete=models.CASCADE, related_name='exams')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_exams')
    title = models.CharField(max_length=255)
    exam_date = models.DateField()
    description = models.TextField(blank=True)
    total_marks = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-exam_date']


class ExamResult(models.Model):
    GRADE_CHOICES = [
        ('A', 'A'),
        ('B', 'B'),
        ('C', 'C'),
        ('D', 'D'),
        ('F', 'F'),
    ]

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_results')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=5, choices=GRADE_CHOICES)
    remarks = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.exam.title}: {self.grade}"

    class Meta:
        ordering = ['-recorded_at']
        unique_together = ['exam', 'student']

    @staticmethod
    def calculate_grade(score, total_marks=100):
        percentage = (score / total_marks) * 100
        if percentage >= 90:
            return 'A'
        elif percentage >= 80:
            return 'B'
        elif percentage >= 70:
            return 'C'
        elif percentage >= 60:
            return 'D'
        else:
            return 'F'


class ResultTemplate(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='result_templates')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='result_templates')
    name = models.CharField(max_length=255, default='Default')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['madrasah', 'school_class']

    def __str__(self):
        return f"{self.school_class.name_en} - {self.name}"


class ResultTemplateItem(models.Model):
    template = models.ForeignKey(ResultTemplate, on_delete=models.CASCADE, related_name='items')
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES)
    name = models.CharField(max_length=255)
    weight = models.DecimalField(max_digits=5, decimal_places=2, help_text='Weight percentage (e.g. 10.00 for 10%)')
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = ['template', 'name']

    def __str__(self):
        return f"{self.name} ({self.weight}%)"


class ResultComponent(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='result_components')
    subject = models.ForeignKey('curriculum.Subject', on_delete=models.CASCADE, related_name='result_components')
    term = models.ForeignKey('academic.Term', on_delete=models.CASCADE, related_name='result_components')
    school_class = models.ForeignKey('curriculum.SchoolClass', on_delete=models.CASCADE, related_name='result_components')
    template_item = models.ForeignKey(ResultTemplateItem, on_delete=models.SET_NULL, null=True, related_name='components')
    component_type = models.CharField(max_length=20, choices=COMPONENT_TYPES)
    name = models.CharField(max_length=255)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    weight = models.DecimalField(max_digits=5, decimal_places=2)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_components')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['subject', 'term', 'component_type', 'name']
        unique_together = ['subject', 'term', 'template_item']

    def __str__(self):
        return f"{self.subject.name_en} - {self.term.name} - {self.name}"


class StudentResult(models.Model):
    component = models.ForeignKey(ResultComponent, on_delete=models.CASCADE, related_name='scores')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_results')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    remarks = models.TextField(blank=True)
    entered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='entered_scores')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['component', 'student']
        unique_together = ['component', 'student']

    def clean(self):
        if self.score > self.component.max_score:
            raise ValidationError(f'Score cannot exceed {self.component.max_score}')

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.component.name}: {self.score}"


class TermResult(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='term_results')
    subject = models.ForeignKey('curriculum.Subject', on_delete=models.CASCADE, related_name='term_results')
    term = models.ForeignKey('academic.Term', on_delete=models.CASCADE, related_name='term_results')
    total_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    grade = models.CharField(max_length=2, blank=True)
    status = models.CharField(max_length=20, choices=TERM_RESULT_STATUS, default='draft')
    published_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='published_results')
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['term', 'subject', 'student']
        unique_together = ['student', 'subject', 'term']

    def calculate_total(self):
        from django.db.models import Sum, F, DecimalField, ExpressionWrapper, OuterRef, Subquery
        components = ResultComponent.objects.filter(subject=self.subject, term=self.term)
        total = 0
        for c in components:
            try:
                sr = StudentResult.objects.get(component=c, student=self.student)
                weighted = float(sr.score) / float(c.max_score) * float(c.weight)
                total += weighted
            except StudentResult.DoesNotExist:
                pass
        self.total_score = round(total, 2)
        self.grade = ExamResult.calculate_grade(total, 100)
        return self.total_score

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.subject.name_en} T{self.term.term_number}: {self.total_score} ({self.grade})"
