from django.apps import AppConfig


class FasaahaConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'fasaaha'
    verbose_name = 'Fasaaha – Arabic Speaking Intelligence'
    default_manager = 'django.db.models.Manager'

    def ready(self):
        import fasaaha.signals  # noqa: F401
