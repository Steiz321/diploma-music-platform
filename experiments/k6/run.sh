#!/bin/sh
# Load tests with k6 (Docker image, inside the compose network).
#   experiments/k6/run.sh           from the repo root, with the stack running
# Summaries go to experiments/results/k6-*.json; the report to load-*.md.
set -e
cd "$(dirname "$0")/../.."

NETWORK=music-platform_default
K6_IMAGE=grafana/k6:1.3.0
RESULTS=experiments/results
STAMP=$(date +%Y-%m-%d-%H%M)

k6() {
  name=$1; shift
  docker run --rm --network "$NETWORK" \
    -v "$PWD/experiments/k6:/scripts:ro" -v "$PWD/$RESULTS:/results" \
    "$K6_IMAGE" run --quiet --summary-export "/results/k6-$STAMP-$name.json" "$@"
}

queue_depth() {
  curl -s -u platform:platform-secret \
    "http://localhost:15672/api/queues/%2F/$1" | node -e \
    'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).messages ?? 0))'
}

echo "== POST /song"
k6 post-song /scripts/post-song.js

echo "== POST /events"
k6 events /scripts/events.js
# how long Analytics needs to work off what the test produced
start=$(date +%s)
while [ "$(queue_depth analytics.events)" -gt 0 ]; do sleep 2; done
echo "{\"analytics_drain_sec\": $(( $(date +%s) - start ))}" > "$RESULTS/k6-$STAMP-drain.json"

echo "== GET /song/recommended (Recommendations up)"
k6 feed-up /scripts/feed.js

echo "== GET /song/recommended (Recommendations paused)"
docker compose pause recommendations >/dev/null
trap 'docker compose unpause recommendations >/dev/null 2>&1 || true' EXIT
k6 feed-down /scripts/feed.js
docker compose unpause recommendations >/dev/null
trap - EXIT

node experiments/src/k6-report.ts "$STAMP"
