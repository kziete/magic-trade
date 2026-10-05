#!/bin/bash
# Deploy the latest code to production: stop the stack, build new images,
# bring it back up. This has downtime for the duration of the build + restart
# (unlike a zero-downtime rollout), but is simple and predictable.

set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.prod.yml"

trap 'echo "Deploy failed (line $LINENO). Check '\''docker compose -f docker-compose.prod.yml logs\'' for details." >&2' ERR

echo "==> Pulling latest code..."
git pull

echo "==> Stopping server..."
docker compose -f "$COMPOSE_FILE" down

echo "==> Building images..."
docker compose -f "$COMPOSE_FILE" build

echo "==> Starting server..."
docker compose -f "$COMPOSE_FILE" up -d

echo "==> Deploy complete."
