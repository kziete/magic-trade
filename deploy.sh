#!/bin/bash
# Deploy the latest code to production with (near) zero downtime, using the
# docker-rollout plugin (https://github.com/Wowu/docker-rollout).
#
# How it works: for each of web/frontend, docker-rollout scales the service
# to 2 replicas (old + new image running side by side), waits for the new
# container's Docker healthcheck to pass, then removes the old one. Caddy
# talks to services by their Compose service name (e.g. "web:8000"), and
# Docker's internal DNS round-robins across both replicas during the
# overlap, so no proxy reconfiguration is needed.
#
# Caveat: this is not a database-migration-aware rollout. Our entrypoint.sh
# runs `migrate` on every container start, so the new "web" replica applies
# migrations while the OLD replica is still serving traffic on the old code.
# If a migration is backward-incompatible with the old code, requests to the
# old replica can fail during that overlap window (typically a few seconds,
# bounded by the healthcheck's start_period). Keep migrations additive/
# backward-compatible if you want this to stay safe.

set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE="docker-compose.prod.yml"

trap 'echo "Deploy failed (line $LINENO). Check '\''docker compose -f docker-compose.prod.yml logs\'' for details." >&2' ERR

PLUGIN_PATH="$HOME/.docker/cli-plugins/docker-rollout"
if [ ! -x "$PLUGIN_PATH" ]; then
  # Note: `docker rollout --help` is NOT a reliable "is it installed" check —
  # Docker resolves --help before checking if "rollout" is a real subcommand,
  # so it prints the generic docker help (exit 0) even when the plugin is
  # missing. Check the plugin file itself instead.
  echo "==> Installing docker-rollout plugin..."
  mkdir -p "$HOME/.docker/cli-plugins"
  curl -fsSL https://raw.githubusercontent.com/wowu/docker-rollout/main/docker-rollout \
    -o "$PLUGIN_PATH"
  chmod +x "$PLUGIN_PATH"
fi

echo "==> Pulling latest code..."
git pull

echo "==> Building new images (old containers keep serving traffic during this step)..."
# BuildKit (the default builder) parallelizes independent Dockerfile stages
# across all available cores with no memory cap of its own, which can be
# enough load on a small droplet to make the live containers sluggish for
# real traffic mid-deploy. Neither Dockerfile uses BuildKit-only syntax
# (cache mounts, heredocs, etc.), so we fall back to the classic builder for
# this step, which honors --memory and builds one Dockerfile step at a time
# instead of BuildKit's concurrent stage graph. We also build web and
# frontend one at a time (not in the same `build` call) so their resource
# usage doesn't stack, and run under `nice`/`ionice` so the build yields CPU
# and disk I/O priority to the containers actually serving traffic.
# Override DEPLOY_BUILD_MEMORY if your droplet needs a different cap.
export DOCKER_BUILDKIT=0
export COMPOSE_DOCKER_CLI_BUILD=0
BUILD_MEMORY="${DEPLOY_BUILD_MEMORY:-1g}"
THROTTLE=(nice -n 19)
if command -v ionice >/dev/null 2>&1; then
  THROTTLE=(ionice -c2 -n7 "${THROTTLE[@]}")
fi
for service in web frontend; do
  "${THROTTLE[@]}" docker compose -f "$COMPOSE_FILE" build --memory "$BUILD_MEMORY" "$service"
done

echo "==> Rolling out web..."
docker rollout -f "$COMPOSE_FILE" web -t 40

echo "==> Rolling out frontend..."
docker rollout -f "$COMPOSE_FILE" frontend -t 40

# echo "==> Reconciling any other changes (Caddyfile, env, compose file)..."
# docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Cleaning up old images..."
docker image prune -f >/dev/null

echo "==> Deploy complete."
