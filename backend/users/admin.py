from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Madrasah, StudentParent


@admin.register(Madrasah)
class MadrasahAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'email', 'created_at']
    search_fields = ['name', 'city']


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'madrasah', 'is_active']
    list_filter = ['role', 'is_active', 'madrasah']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']

    fieldsets = UserAdmin.fieldsets + (
        ('Madrasah Info', {'fields': ('role', 'madrasah')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Madrasah Info', {'fields': ('role', 'madrasah')}),
    )


@admin.register(StudentParent)
class StudentParentAdmin(admin.ModelAdmin):
    list_display = ['student', 'parent', 'relationship']
    list_filter = ['relationship']
