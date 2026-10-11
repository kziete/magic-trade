#!/bin/bash
# Deploy the latest code to production: stop the stack, build new images,
# bring it back up. This has downtime for the duration of the build + restart
# (unlike a zero-downtime rollout), but is simple and predictable.

set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.prod.yml"
# --env-file is needed so docker compose resolves ${VAR}-style substitutions
# in docker-compose.prod.yml (e.g. the frontend's NEXT_PUBLIC_GTM_ID build
# arg) from .env.prod. Without it, compose falls back to a plain ".env" in
# this directory, which is the local-dev env file, not production's.
COMPOSE="docker compose --env-file .env.prod -f $COMPOSE_FILE"

trap 'echo "Deploy failed (line $LINENO). Check '\''docker compose -f docker-compose.prod.yml logs\'' for details." >&2' ERR

echo "==> Pulling latest code..."
git pull

echo "==> Stopping server..."
$COMPOSE down

echo "==> Building images..."
$COMPOSE build

echo "==> Starting server..."
$COMPOSE up -d

echo "==> Deploy complete."
