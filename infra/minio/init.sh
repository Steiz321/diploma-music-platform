#!/bin/sh
# One-shot MinIO initialisation, run by the minio-init service in docker compose:
#   - creates the files bucket;
#   - allows anonymous read of objects (GetObject only, no bucket listing);
#   - uploads default images referenced by the server (mock avatar / cover).
# Idempotent: safe to run on every `docker compose up`.
set -eu

: "${MINIO_ENDPOINT:?}" "${MINIO_ROOT_USER:?}" "${MINIO_ROOT_PASSWORD:?}" "${S3_BUCKET:?}"
SEED_DIR="${SEED_DIR:-/seed}"

attempt=0
until mc alias set local "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "MinIO at $MINIO_ENDPOINT is not reachable" >&2
    exit 1
  fi
  sleep 1
done

mc mb --ignore-existing "local/$S3_BUCKET"

# `mc anonymous set download` would also allow listing the bucket,
# so apply a policy with GetObject only.
POLICY_FILE="$(mktemp)"
sed "s/BUCKET_NAME/$S3_BUCKET/" "$(dirname "$0")/public-read-policy.json" > "$POLICY_FILE"
mc anonymous set-json "$POLICY_FILE" "local/$S3_BUCKET"
rm -f "$POLICY_FILE"

mc cp "$SEED_DIR/mock_avatar.png" "$SEED_DIR/mock-cover.jpg" "local/$S3_BUCKET/"

echo "Bucket $S3_BUCKET is ready"
