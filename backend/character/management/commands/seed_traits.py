from django.core.management.base import BaseCommand
from users.models import Madrasah
from character.models import CharacterTrait

DEFAULT_TRAITS = [
    # Moral
    {'name': 'Honesty', 'name_ar': 'الصدق', 'category': 'moral', 'sort_order': 1, 'description': 'Truthfulness in words and actions'},
    {'name': 'Trustworthiness', 'name_ar': 'الأمانة', 'category': 'moral', 'sort_order': 2, 'description': 'Being reliable and dependable'},
    {'name': 'Justice', 'name_ar': 'العدل', 'category': 'moral', 'sort_order': 3, 'description': 'Fairness in dealing with others'},
    {'name': 'Courage', 'name_ar': 'الشجاعة', 'category': 'moral', 'sort_order': 4, 'description': 'Standing up for what is right'},
    # Social
    {'name': 'Respect', 'name_ar': 'الاحترام', 'category': 'social', 'sort_order': 5, 'description': 'Showing respect to teachers and peers'},
    {'name': 'Cooperation', 'name_ar': 'التعاون', 'category': 'social', 'sort_order': 6, 'description': 'Working well with others'},
    {'name': 'Responsibility', 'name_ar': 'المسؤولية', 'category': 'social', 'sort_order': 7, 'description': 'Taking ownership of actions'},
    {'name': 'Leadership', 'name_ar': 'القيادة', 'category': 'social', 'sort_order': 8, 'description': 'Guiding and inspiring others positively'},
    # Spiritual
    {'name': 'Prayerfulness', 'name_ar': 'المحافظة على الصلاة', 'category': 'spiritual', 'sort_order': 9, 'description': 'Regularity in prayers'},
    {'name': 'Quran Connection', 'name_ar': 'الارتباط بالقرآن', 'category': 'spiritual', 'sort_order': 10, 'description': 'Engagement with Quran recitation and memorization'},
    {'name': 'Gratitude', 'name_ar': 'الشكر', 'category': 'spiritual', 'sort_order': 11, 'description': 'Thankfulness to Allah and others'},
    {'name': 'Good Character', 'name_ar': 'حسن الخلق', 'category': 'spiritual', 'sort_order': 12, 'description': 'Embodying Islamic manners'},
    # Academic
    {'name': 'Diligence', 'name_ar': 'الاجتهاد', 'category': 'academic', 'sort_order': 13, 'description': 'Consistent effort in studies'},
    {'name': 'Curiosity', 'name_ar': 'حب الاستطلاع', 'category': 'academic', 'sort_order': 14, 'description': 'Eagerness to learn and ask questions'},
    {'name': 'Organization', 'name_ar': 'التنظيم', 'category': 'academic', 'sort_order': 15, 'description': 'Keeping work and materials organized'},
    {'name': 'Critical Thinking', 'name_ar': 'التفكير الناقد', 'category': 'academic', 'sort_order': 16, 'description': 'Analytical approach to learning'},
    # Personal
    {'name': 'Self-Discipline', 'name_ar': 'ضبط النفس', 'category': 'personal', 'sort_order': 17, 'description': 'Control over impulses and habits'},
    {'name': 'Patience', 'name_ar': 'الصبر', 'category': 'personal', 'sort_order': 18, 'description': 'Ability to wait and persevere'},
    {'name': 'Cleanliness', 'name_ar': 'النظافة', 'category': 'personal', 'sort_order': 19, 'description': 'Personal and environmental hygiene'},
    {'name': 'Punctuality', 'name_ar': 'الدقة في المواعيد', 'category': 'personal', 'sort_order': 20, 'description': 'Being on time for classes and activities'},
]


class Command(BaseCommand):
    help = 'Seed default character traits for all madaris'

    def handle(self, *args, **options):
        for madrasah in Madrasah.objects.all():
            for trait in DEFAULT_TRAITS:
                _, created = CharacterTrait.objects.get_or_create(
                    madrasah=madrasah,
                    name=trait['name'],
                    defaults={
                        'name_ar': trait['name_ar'],
                        'category': trait['category'],
                        'sort_order': trait['sort_order'],
                        'description': trait['description'],
                    },
                )
                if created:
                    self.stdout.write(f'  Created trait "{trait["name"]}" for {madrasah.name}')
        self.stdout.write(self.style.SUCCESS('Traits seeded successfully'))
