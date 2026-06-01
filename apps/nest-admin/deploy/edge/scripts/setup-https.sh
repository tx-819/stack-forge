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

if [ -z "${EDGE_DOMAIN:-}" ]; then
  echo "EDGE_DOMAIN is required in .env" >&2
  exit 1
fi

if [ -z "${CERTBOT_EMAIL:-}" ]; then
  echo "CERTBOT_EMAIL is required in .env" >&2
  exit 1
fi

echo "Issuing certificate for: $EDGE_DOMAIN"
docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$EDGE_DOMAIN" \
  --email "$CERTBOT_EMAIL" \
  --agree-tos --non-interactive

echo "Switching nginx config to HTTPS template"
cp ./nginx/conf.d/react-admin.conf.https.example ./nginx/conf.d/react-admin.conf
sed -i.bak "s/app\.example\.com/${EDGE_DOMAIN}/g" ./nginx/conf.d/react-admin.conf
grep -n "${EDGE_DOMAIN}" ./nginx/conf.d/react-admin.conf

echo "Validating and reloading nginx"
docker compose exec nginx nginx -t
docker compose exec nginx nginx -s reload

echo "HTTPS setup completed for: $EDGE_DOMAIN"
