#!/bin/sh
set -eu

: "${BASE_URL:?Set BASE_URL, for example https://staging.madrasahlms.com.ng}"

curl --fail --silent --show-error "$BASE_URL/health/" | grep -q 'healthy'
curl --fail --silent --show-error "$BASE_URL/" >/dev/null

if [ -n "${TEST_EMAIL:-}" ] && [ -n "${TEST_PASSWORD:-}" ]; then
    response=$(curl --fail --silent --show-error \
        -H 'Content-Type: application/json' \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        "$BASE_URL/api/v1/auth/login/")
    printf '%s' "$response" | grep -q 'tokens'
fi

printf 'Smoke checks passed for %s\n' "$BASE_URL"
