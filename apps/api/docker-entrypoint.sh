#!/bin/sh
set -e

run_prisma_migrate() {
    attempts="${DB_CONNECT_RETRY_ATTEMPTS:-30}"
    delay="${DB_CONNECT_RETRY_DELAY_SECONDS:-2}"
    attempt=1

    while [ "$attempt" -le "$attempts" ]; do
        echo "[entrypoint] Running prisma migrate deploy (attempt $attempt/$attempts)..."

        if prisma migrate deploy; then
            return 0
        fi

        if [ "$attempt" -eq "$attempts" ]; then
            echo "[entrypoint] ERROR: prisma migrate deploy failed after $attempts attempts."
            return 1
        fi

        echo "[entrypoint] Database is not ready yet, retrying in ${delay}s..."
        sleep "$delay"
        attempt=$((attempt + 1))
    done
}

if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    run_prisma_migrate
else
    echo "[entrypoint] WARNING: no prisma/migrations found, skipping migrate deploy."
    echo "[entrypoint] Generate initial migration locally with: pnpm prisma migrate dev --name init"
fi

exec node dist/main.js
