#!/bin/sh
# Dev entrypoint for Node services of the npm workspace with the source code
# bind-mounted. node_modules lives in Docker volumes (native modules must be
# built for Linux), so reinstall whenever the root package-lock.json changes.
# NPM_WORKSPACE limits the install to one workspace (e.g. @platform/core).
set -e

ROOT=/app
LOCK_HASH="$(sha256sum "$ROOT/package-lock.json" | cut -d ' ' -f 1)"
HASH_FILE="$ROOT/node_modules/.package-lock.sha256"

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE")" != "$LOCK_HASH" ]; then
  echo "package-lock.json changed, running npm ci..."
  (cd "$ROOT" && npm ci --no-audit --no-fund ${NPM_WORKSPACE:+--workspace="$NPM_WORKSPACE"})
  echo "$LOCK_HASH" > "$HASH_FILE"
fi

exec "$@"
