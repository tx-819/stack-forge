#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
EDGE_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$EDGE_ROOT"

if [ ! -f ".env" ]; then
  echo "Missing .env. Run: cp .env.example .env" >&2
  exit 1
fi

set -a
. ./.env
set +a

if [ -z "${API_DOMAIN:-}" ]; then
  echo "API_DOMAIN is required in .env" >&2
  exit 1
fi

if [ -z "${CERTBOT_EMAIL:-}" ]; then
  echo "CERTBOT_EMAIL is required in .env" >&2
  exit 1
fi

echo "Issuing certificate for API: $API_DOMAIN"
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$API_DOMAIN" \
  --email "$CERTBOT_EMAIL" \
  --agree-tos --non-interactive

echo "Switching API nginx config to HTTPS template"
cp ./nginx/conf.d/nest-admin-api.conf.https.example ./nginx/conf.d/nest-admin-api.conf
sed -i.bak "s/api\.example\.com/${API_DOMAIN}/g" ./nginx/conf.d/nest-admin-api.conf
grep -n "${API_DOMAIN}" ./nginx/conf.d/nest-admin-api.conf

echo "Validating and reloading nginx"
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload

echo "HTTPS setup completed for API: $API_DOMAIN"
