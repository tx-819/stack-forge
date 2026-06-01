#!/bin/sh
set -e

if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    prisma migrate deploy
else
    echo "[entrypoint] WARNING: no prisma/migrations found, skipping migrate deploy."
    echo "[entrypoint] Generate initial migration locally with: pnpm prisma migrate dev --name init"
fi

exec node dist/main.js
