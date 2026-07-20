from django.contrib import admin
from .models import CharacterTrait, CharacterEvaluation, CharacterScore

admin.site.register(CharacterTrait)
admin.site.register(CharacterEvaluation)
admin.site.register(CharacterScore)
