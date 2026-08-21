#!/bin/sh
set -eu

: "${BACKUP_DIR:?Set BACKUP_DIR to encrypted, durable storage}"
: "${POSTGRES_DB:?Set POSTGRES_DB}"
: "${POSTGRES_USER:?Set POSTGRES_USER}"
: "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}"

mkdir -p "$BACKUP_DIR"
export PGPASSWORD="$POSTGRES_PASSWORD"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
tmp_file="$BACKUP_DIR/.madrasah-${timestamp}.dump"
backup_file="$BACKUP_DIR/madrasah-${timestamp}.dump.gz"

cleanup() {
    rm -f "$tmp_file"
    unset PGPASSWORD
}
trap cleanup EXIT INT TERM

docker compose -f docker-compose.production.yml exec -T db \
    pg_dump --format=custom --no-owner --no-acl \
    --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" > "$tmp_file"
gzip -9 "$tmp_file"
mv "$tmp_file.gz" "$backup_file"

find "$BACKUP_DIR" -type f -name 'madrasah-*.dump.gz' -mtime +30 -delete
printf 'Created %s\n' "$backup_file"
