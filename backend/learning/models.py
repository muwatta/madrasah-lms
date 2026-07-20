from django.db import models
from django.utils import timezone
from users.models import User, Madrasah
from curriculum.models import Subject


class LearningPath(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='learning_paths')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_paths')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='learning_paths')
    title = models.CharField(max_length=200)
    current_level = models.IntegerField(default=1)
    total_levels = models.IntegerField(default=10)
    progress_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'subject']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'is_active'], name='idx_lp_student_active'),
        ]

    def __str__(self):
        return f"{self.student} - {self.subject}"

    def update_progress(self):
        total = self.items.count()
        if total == 0:
            self.progress_percent = 0
        else:
            completed = self.items.filter(is_completed=True).count()
            self.progress_percent = round((completed / total) * 100, 2)
        self.save(update_fields=['progress_percent', 'updated_at'])


class LearningPathItem(models.Model):
    ITEM_TYPE_CHOICES = [
        ('lesson', 'Lesson'),
        ('quiz', 'Quiz'),
        ('practice', 'Practice'),
        ('video', 'Video'),
        ('reading', 'Reading'),
        ('project', 'Project'),
    ]

    learning_path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='items')
    title = models.CharField(max_length=200)
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    content = models.TextField(blank=True)
    order = models.IntegerField()
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        unique_together = ['learning_path', 'order']

    def __str__(self):
        return self.title

    def mark_complete(self, score=None):
        self.is_completed = True
        self.completed_at = timezone.now()
        if score is not None:
            self.score = score
        self.save(update_fields=['is_completed', 'completed_at', 'score'])
        self.learning_path.update_progress()


class FlashCardDeck(models.Model):
    madrasah = models.ForeignKey(Madrasah, on_delete=models.CASCADE, related_name='flashcard_decks')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='flashcard_decks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_shared = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_flashcard_decks')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class FlashCard(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    deck = models.ForeignKey(FlashCardDeck, on_delete=models.CASCADE, related_name='cards')
    front = models.TextField()
    back = models.TextField()
    hint = models.TextField(blank=True)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.front[:50]


class FlashCardReview(models.Model):
    card = models.ForeignKey(FlashCard, on_delete=models.CASCADE, related_name='reviews')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcard_reviews')
    quality = models.IntegerField()
    reviewed_at = models.DateTimeField(auto_now_add=True)
    next_review = models.DateTimeField()
    interval_days = models.IntegerField(default=1)
    easiness_factor = models.DecimalField(max_digits=4, decimal_places=2, default=2.5)

    class Meta:
        ordering = ['-reviewed_at']

    def __str__(self):
        return self.card.front[:50]

    @staticmethod
    def calculate_sm2(quality, current_ef, current_interval):
        """SM-2 spaced repetition algorithm."""
        ef = current_ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        if ef < 1.3:
            ef = 1.3

        if quality < 3:
            interval = 1
        else:
            if current_interval == 1:
                interval = 6
            else:
                interval = round(current_interval * ef)

        return round(ef, 2), interval

    def save(self, *args, **kwargs):
        if not self.next_review:
            self.next_review = timezone.now() + timezone.timedelta(days=self.interval_days)
        super().save(*args, **kwargs)
