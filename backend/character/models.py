from django.db import models
from users.models import User, Madrasah


class CharacterTrait(models.Model):
    CATEGORY_CHOICES = [
        ('moral', 'Moral'),
        ('social', 'Social'),
        ('spiritual', 'Spiritual'),
        ('academic', 'Academic'),
        ('personal', 'Personal'),
    ]

    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='character_traits')
    name = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order']
        unique_together = ['madrasah', 'name']

    def __str__(self):
        return self.name


class CharacterEvaluation(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='character_evaluations')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='character_evaluations')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='character_evaluations_given')
    evaluation_date = models.DateField()
    term = models.ForeignKey(
        'academic.Term',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='character_evaluations',
    )
    overall_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-evaluation_date']
        unique_together = ['student', 'evaluation_date', 'teacher']

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.evaluation_date}"


class CharacterScore(models.Model):
    SCORE_CHOICES = [
        (1, 'Poor'),
        (2, 'Needs Improvement'),
        (3, 'Satisfactory'),
        (4, 'Good'),
        (5, 'Excellent'),
    ]

    evaluation = models.ForeignKey(CharacterEvaluation, on_delete=models.CASCADE, related_name='scores')
    trait = models.ForeignKey(CharacterTrait, on_delete=models.CASCADE, related_name='scores')
    score = models.IntegerField(choices=SCORE_CHOICES)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['evaluation', 'trait']

    def __str__(self):
        return f"{self.trait.name}: {self.score}"
