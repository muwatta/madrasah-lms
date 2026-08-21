import os
from pathlib import Path
from decouple import config
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key')
ENVIRONMENT = config('ENVIRONMENT', default='development')
DEBUG = config('DEBUG', default=False, cast=bool)
if ENVIRONMENT.lower() == 'production' and DEBUG:
    raise ImproperlyConfigured('DEBUG must be False in production.')
ALLOWED_HOSTS = ['*'] if DEBUG else [
    host.strip() for host in config('ALLOWED_HOSTS', default='').split(',') if host.strip()
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'django_filters',
    'users',
    'curriculum',
    'assessments',
    'quizzes',
    'results',
    'school_ops',
    'academic',
    'lessons',
    'admissions',
    'quran',
    'analytics',
    'guidance',
    'learning',
    'whatsapp',
    'character',
    'certificates',
    'fasaaha',
    'audit',
    'question_banks',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='madrasah_lms'),
        'USER': config('DB_USER', default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default='postgres'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': config('DB_CONN_MAX_AGE', default=60, cast=int),
        'OPTIONS': {
            'sslmode': 'require' if config('DB_SSL_REQUIRE', default=False, cast=bool) else 'prefer',
        },
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Lagos'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'users.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
        'config.permissions.IsApprovedMember',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/hour',
        'user': '1200/hour',
        'landing': '600/hour',
    },
}
# Security hardening. These are explicit so `manage.py check --deploy` reflects
# the actual production profile instead of depending on middleware defaults.
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=not DEBUG, cast=bool)
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=31536000 if not DEBUG else 0, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# File upload limits (10 MB).
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
FILE_UPLOAD_PERMISSIONS = 0o644

CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in config('CORS_ALLOWED_ORIGINS', default='').split(',') if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True

JWT_SECRET = config('JWT_SECRET', default='jwt-secret-key-change')
JWT_EXPIRATION_HOURS = config('JWT_EXPIRATION_HOURS', default=24, cast=int)
QR_SECRET_KEY = config('QR_SECRET_KEY', default='change-me-in-production')
DJANGO_ADMIN_ENABLED = config('DJANGO_ADMIN_ENABLED', default=DEBUG, cast=bool)
PUBLIC_STATS_ENABLED = config('PUBLIC_STATS_ENABLED', default=DEBUG, cast=bool)
SENTRY_DSN = config('SENTRY_DSN', default='')
SENTRY_TRACES_SAMPLE_RATE = config('SENTRY_TRACES_SAMPLE_RATE', default=0.0, cast=float)

if SENTRY_DSN:
    import sentry_sdk

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=ENVIRONMENT,
        traces_sample_rate=SENTRY_TRACES_SAMPLE_RATE,
        send_default_pii=False,
    )

if not DEBUG:
    placeholder_secrets = {
        'SECRET_KEY': SECRET_KEY,
        'JWT_SECRET': JWT_SECRET,
        'QR_SECRET_KEY': QR_SECRET_KEY,
    }
    for name, value in placeholder_secrets.items():
        if len(value) < 50 or value in {
            'django-insecure-dev-key',
            'django-insecure-change-me',
            'jwt-secret-key-change',
            'change-me-in-production',
            'change-me-to-a-long-random-string',
        }:
            raise ImproperlyConfigured(
                f'{name} must be a strong random value when DEBUG=False.'
            )
    if not ALLOWED_HOSTS:
        raise ImproperlyConfigured('ALLOWED_HOSTS must be configured when DEBUG=False.')
    if not CORS_ALLOWED_ORIGINS:
        raise ImproperlyConfigured(
            'CORS_ALLOWED_ORIGINS must contain explicit origins when DEBUG=False.'
        )
    if len(config('DB_PASSWORD', default='')) < 20:
        raise ImproperlyConfigured(
            'DB_PASSWORD must be configured with a strong value when DEBUG=False.'
        )

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': config('LOG_LEVEL', default='INFO'),
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': config('DJANGO_LOG_LEVEL', default='WARNING'),
            'propagate': False,
        },
    },
}

# Celery
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Lagos'

# Cache (Redis) — used by DRF throttling, must be shared so rate limits are
# enforced consistently across gunicorn workers.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('CACHE_URL', default='redis://localhost:6379/1'),
    },
}

CELERY_BEAT_SCHEDULE = {
    'send-fee-reminders': {
        'task': 'whatsapp.tasks.send_overdue_fee_reminders',
        'schedule': 43200,  # every 12 hours
    },
    'send-daily-attendance-summary': {
        'task': 'whatsapp.tasks.send_daily_attendance_summary',
        'schedule': 86400,  # once daily
    },
    'process-pending-messages': {
        'task': 'whatsapp.tasks.process_pending_messages',
        'schedule': 300,  # every 5 minutes
    },
    'purge-expired-refresh-tokens': {
        'task': 'users.tasks.purge_expired_refresh_tokens',
        'schedule': 86400,  # once daily
    },
}

WHATSAPP_PHONE_NUMBER_ID = config('WHATSAPP_PHONE_NUMBER_ID', default='')
WHATSAPP_ACCESS_TOKEN = config('WHATSAPP_ACCESS_TOKEN', default='')
WHATSAPP_API_VERSION = config('WHATSAPP_API_VERSION', default='v22.0')
WHATSAPP_WEBHOOK_VERIFY_TOKEN = config('WHATSAPP_VERIFY_TOKEN', default='madrasah_lms_verify_token')
WHATSAPP_VERIFY_TOKEN = WHATSAPP_WEBHOOK_VERIFY_TOKEN
WHATSAPP_BUSINESS_ACCOUNT_ID = config('WHATSAPP_BUSINESS_ACCOUNT_ID', default='')
WHATSAPP_APP_SECRET = config('WHATSAPP_APP_SECRET', default='')
WHATSAPP_WEBHOOK_ENABLED = config('WHATSAPP_WEBHOOK_ENABLED', default=DEBUG, cast=bool)
WHATSAPP_BASE_URL = 'https://graph.facebook.com'

if not DEBUG and WHATSAPP_WEBHOOK_ENABLED and len(WHATSAPP_APP_SECRET) < 32:
    raise ImproperlyConfigured(
        'WHATSAPP_APP_SECRET must be configured when the webhook is enabled.'
    )

if not DEBUG and WHATSAPP_ACCESS_TOKEN and not WHATSAPP_APP_SECRET:
    raise ImproperlyConfigured(
        'WHATSAPP_APP_SECRET must be set when WhatsApp is enabled and DEBUG=False.'
    )

# Web Push (VAPID)
VAPID_PUBLIC_KEY = config('VAPID_PUBLIC_KEY', default='')
VAPID_PRIVATE_KEY = config('VAPID_PRIVATE_KEY', default='')

# Email (Resend) 
RESEND_API_KEY = config('RESEND_API_KEY', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@madrasahlms.com')
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

# AI Provider (OpenAI / Groq / etc.) 
OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
OPENAI_BASE_URL = config('OPENAI_BASE_URL', default='')
OPENAI_MODEL = config('OPENAI_MODEL', default='gpt-4o-mini')
OPENAI_MAX_TOKENS = config('OPENAI_MAX_TOKENS', default=1024, cast=int)
OPENAI_TEMPERATURE = config('OPENAI_TEMPERATURE', default=0.7, cast=float)

# Azure Speech Services AZURE_SPEECH_KEY = config('AZURE_SPEECH_KEY', default='')
AZURE_SPEECH_REGION = config('AZURE_SPEECH_REGION', default='')

# Celery eager mode (dev convenience) 
CELERY_TASK_ALWAYS_EAGER = config('CELERY_TASK_ALWAYS_EAGER', default=False, cast=bool)
