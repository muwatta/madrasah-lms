import os

from django.core.exceptions import ValidationError
from django.template.defaultfilters import filesizeformat


ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
ALLOWED_DOCUMENT_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'}
ALLOWED_AUDIO_EXTENSIONS = {'.mp3', '.wav', '.ogg', '.m4a'}
ALLOWED_GENERIC_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_DOCUMENT_EXTENSIONS | ALLOWED_AUDIO_EXTENSIONS
ALLOWED_TUTOR_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_IMAGE_SIZE = 5 * 1024 * 1024   # 5 MB
MAX_AUDIO_SIZE = 20 * 1024 * 1024  # 20 MB
MAX_TUTOR_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_file_extension(allowed_extensions):
    def inner(value):
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in allowed_extensions:
            raise ValidationError(
                f'Unsupported file extension "{ext}". Allowed: {", ".join(sorted(allowed_extensions))}.'
            )
    return inner


def validate_file_size(max_size):
    def inner(value):
        if value.size > max_size:
            raise ValidationError(
                f'File size exceeds {filesizeformat(max_size)}. Current size: {filesizeformat(value.size)}.'
            )
    return inner


def validate_image(value):
    validate_file_extension(ALLOWED_IMAGE_EXTENSIONS)(value)
    validate_file_size(MAX_IMAGE_SIZE)(value)


def validate_document(value):
    validate_file_extension(ALLOWED_DOCUMENT_EXTENSIONS)(value)
    validate_file_size(MAX_FILE_SIZE)(value)


def validate_audio(value):
    validate_file_extension(ALLOWED_AUDIO_EXTENSIONS)(value)
    validate_file_size(MAX_AUDIO_SIZE)(value)


def validate_generic_file(value):
    validate_file_extension(ALLOWED_GENERIC_EXTENSIONS)(value)
    validate_file_size(MAX_FILE_SIZE)(value)


def validate_tutor_file(value):
    validate_file_extension(ALLOWED_TUTOR_EXTENSIONS)(value)
    validate_file_size(MAX_TUTOR_FILE_SIZE)(value)
