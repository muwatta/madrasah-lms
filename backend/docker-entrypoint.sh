#!/bin/sh
set -e

echo "Waiting for PostgreSQL at ${DB_HOST:-db}:${DB_PORT:-5432}..."
python - <<'EOF'
import os
import socket
import time

host = os.environ.get('DB_HOST', 'db')
port = int(os.environ.get('DB_PORT', '5432'))

while True:
    try:
        with socket.create_connection((host, port), timeout=2):
            break
    except OSError:
        time.sleep(1)

print("PostgreSQL is ready.")
EOF

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput
fi

exec "$@"
