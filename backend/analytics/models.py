from django.db import models
from users.models import User, Madrasah


class AtRiskPrediction(models.Model):
    RISK_LEVEL_CHOICES = [
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='at_risk_predictions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='at_risk_predictions')
    risk_score = models.DecimalField(max_digits=5, decimal_places=2)
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES)
    factors = models.JSONField(default=dict)
    recommendations = models.TextField(blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-risk_score']
        unique_together = ['madrasah', 'student']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.risk_level} ({self.risk_score})"


class SkillAssessment(models.Model):
    SKILL_CHOICES = [
        ('problem_solving', 'Problem Solving'),
        ('creativity', 'Creativity'),
        ('communication', 'Communication'),
        ('leadership', 'Leadership'),
        ('critical_thinking', 'Critical Thinking'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='skill_assessments')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='skill_assessments')
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='skill_assessments_given')
    skill_name = models.CharField(max_length=100, choices=SKILL_CHOICES)
    score = models.IntegerField()
    assessment_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'skill_name', 'assessment_date']
        ordering = ['-assessment_date']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.skill_name}: {self.score}"


class DigitalPortfolio(models.Model):
    ITEM_TYPE_CHOICES = [
        ('project', 'Project'),
        ('certificate', 'Certificate'),
        ('award', 'Award'),
        ('achievement', 'Achievement'),
        ('video', 'Video'),
        ('other', 'Other'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='digital_portfolios')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='digital_portfolios')
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True)
    file = models.FileField(upload_to='portfolios/', null=True, blank=True)
    date_achieved = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_achieved', '-created_at']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.title}"
