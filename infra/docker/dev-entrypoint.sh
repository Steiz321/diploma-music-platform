#!/bin/sh
# Dev entrypoint for Node services with the source code bind-mounted.
# node_modules lives in a Docker volume (native modules must be built for
# Linux), so reinstall it whenever package-lock.json changes.
set -e

LOCK_HASH="$(sha256sum package-lock.json | cut -d ' ' -f 1)"
HASH_FILE=node_modules/.package-lock.sha256

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE")" != "$LOCK_HASH" ]; then
  echo "package-lock.json changed, running npm ci..."
  npm ci --no-audit --no-fund
  echo "$LOCK_HASH" > "$HASH_FILE"
fi

exec "$@"
