# VPS Production Runbook

Target domain: `madrasahlms.com.ng`

## 1. VPS and DNS

- Use a supported Linux VPS with Docker Engine and Compose v2.
- Create DNS `A` and, if applicable, `AAAA` records for `madrasahlms.com.ng` pointing to the VPS.
- Allow only TCP 22 from an administrator IP range, and TCP 80/443 from the internet:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from ADMIN_IP_RANGE to any port 22 proto tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Do not expose PostgreSQL, Redis, or the frontend container ports publicly.

## 2. Secrets

On the VPS, inside the repository directory, create the ignored file without pasting secrets into chat:

```bash
cp backend/.env.production.example backend/.env.production
chmod 600 backend/.env.production
openssl rand -base64 60      # generate values for SECRET_KEY, JWT_SECRET, and QR_SECRET_KEY
openssl rand -base64 32      # generate database, Redis, and webhook secrets
```

Replace every `replace-with-...` value. Set:

- `DOMAIN=madrasahlms.com.ng`
- `ALLOWED_HOSTS=madrasahlms.com.ng`
- `CORS_ALLOWED_ORIGINS=https://madrasahlms.com.ng`
- `FRONTEND_URL=https://madrasahlms.com.ng`
- `ENVIRONMENT=production`
- `DEBUG=False`
- `RESEND_API_KEY` and `SENTRY_DSN` from their providers

Keep `DJANGO_ADMIN_ENABLED=False` unless admin access is separately restricted by VPN or an allowlisted reverse proxy.

## 3. Launch

```bash
docker compose --env-file backend/.env.production \
  -f docker-compose.production.yml up -d --build
docker compose --env-file backend/.env.production \
  -f docker-compose.production.yml ps
curl --fail https://madrasahlms.com.ng/health/
```

Caddy obtains and renews the TLS certificate automatically after DNS resolves and ports 80/443 are reachable.

## 4. Backups

Use encrypted durable storage mounted on the VPS or an off-host backup mount:

```bash
export BACKUP_DIR=/var/backups/madrasah-lms
export POSTGRES_DB=madrasah_lms
export POSTGRES_USER=madrasah_lms
export POSTGRES_PASSWORD='read-from-the-secret-store'
./ops/backup-postgres.sh
gzip -t "$BACKUP_DIR"/*.dump.gz
```

Schedule the script with a systemd timer or cron. Copy backups off-host, retain at least daily and weekly generations, and perform a restore test before launch and at least monthly.

## 5. Staging smoke test

Run this against staging after deployment:

```bash
BASE_URL=https://staging.madrasahlms.com.ng \
TEST_EMAIL=staging-user@example.com \
TEST_PASSWORD='read-from-the-secret-store' \
./ops/staging-smoke-test.sh
```

Manually verify login, file upload/download authorization, a Celery task, Resend password reset and email verification, WhatsApp signature verification if enabled, and password reset completion. Check Sentry receives a controlled staging test event and that alerts reach the on-call channel.

## 6. Rollback

Keep the previous image available. Before each release, record the image digest and run migrations. To roll back application code:

```bash
git checkout PREVIOUS_RELEASE
# restore the matching environment and deploy
docker compose --env-file backend/.env.production \
  -f docker-compose.production.yml up -d --build
```

Never roll back database migrations without a tested database restore plan.
