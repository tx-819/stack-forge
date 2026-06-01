#!/usr/bin/env sh
set -eu

usage() {
  echo "Usage: $0 [admin|api|all]" >&2
  echo "  admin  EDGE_DOMAIN → admin.conf (default)" >&2
  echo "  api    API_DOMAIN → api.conf" >&2
  echo "  all    both sites, single nginx reload at end" >&2
  exit 1
}

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
EDGE_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$EDGE_ROOT"

SITE="${1:-admin}"
case "$SITE" in
  admin|api|all) ;;
  -h|--help) usage ;;
  *) usage ;;
esac

if [ ! -f ".env" ]; then
  echo "Missing .env. Run: cp .env.example .env" >&2
  exit 1
fi

set -a
. ./.env
set +a

if [ -z "${CERTBOT_EMAIL:-}" ]; then
  echo "CERTBOT_EMAIL is required in .env" >&2
  exit 1
fi

setup_one() {
  site="$1"
  case "$site" in
    admin)
      domain="${EDGE_DOMAIN:-}"
      placeholder='app\.example\.com'
      conf_base='admin'
      label='frontend'
      ;;
    api)
      domain="${API_DOMAIN:-}"
      placeholder='api\.example\.com'
      conf_base='api'
      label='API'
      ;;
    *)
      echo "internal error: unknown site $site" >&2
      exit 1
      ;;
  esac

  if [ -z "$domain" ]; then
    if [ "$site" = admin ]; then
      echo "EDGE_DOMAIN is required in .env" >&2
    else
      echo "API_DOMAIN is required in .env" >&2
    fi
    exit 1
  fi

  echo "Issuing certificate for $label: $domain"
  docker compose run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    -d "$domain" \
    --email "$CERTBOT_EMAIL" \
    --agree-tos --non-interactive

  echo "Switching $label nginx config to HTTPS template"
  cp "./nginx/conf.d/${conf_base}.conf.https.example" "./nginx/conf.d/${conf_base}.conf"
  sed -i.bak "s/${placeholder}/${domain}/g" "./nginx/conf.d/${conf_base}.conf"
  grep -n "$domain" "./nginx/conf.d/${conf_base}.conf"
  echo "HTTPS config ready for $label: $domain"
}

reload_nginx() {
  echo "Validating and reloading nginx"
  docker compose exec nginx nginx -t
  docker compose exec nginx nginx -s reload
}

case "$SITE" in
  admin) setup_one admin; reload_nginx ;;
  api) setup_one api; reload_nginx ;;
  all)
    setup_one admin
    setup_one api
    reload_nginx
    echo "HTTPS setup completed for EDGE_DOMAIN and API_DOMAIN"
    ;;
esac

if [ "$SITE" != all ]; then
  echo "HTTPS setup completed ($SITE)"
fi
