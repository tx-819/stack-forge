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

echo "==> HEAD http://${EDGE_DOMAIN}/"
curl -sS -I --max-time 20 "http://${EDGE_DOMAIN}/" || exit 1
echo
echo "==> HEAD https://${EDGE_DOMAIN}/"
curl -sS -I --max-time 20 "https://${EDGE_DOMAIN}/" || exit 1
echo

if [ -n "${API_DOMAIN:-}" ]; then
  echo "==> HEAD http://${API_DOMAIN}/"
  curl -sS -I --max-time 20 "http://${API_DOMAIN}/" || exit 1
  echo
  echo "==> HEAD https://${API_DOMAIN}/"
  curl -sS -I --max-time 20 "https://${API_DOMAIN}/" || exit 1
  echo
fi

echo "OK: endpoints responded (see status lines above)."
