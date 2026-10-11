// POST /events throughput: batches of player events from many users. Every
// user stays within the rate limit (30 requests / min), so the test measures
// the endpoint and the outbox, not the limiter.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { API, auth, register, uuid } from './common.js';

const USERS = 20;
const BATCH = 20;

export const options = {
  scenarios: {
    players: { executor: 'constant-vus', vus: USERS, duration: '60s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    // a threshold on the tag also exports the endpoint's own timings
    // (without the registration requests of setup)
    'http_req_duration{name:POST /events}': ['p(95)<1000'],
  },
};

const accepted = new Counter('events_accepted');

export function setup() {
  return { tokens: Array.from({ length: USERS }, () => register('k6-player')) };
}

export default function (data) {
  const token = data.tokens[(__VU - 1) % data.tokens.length];
  const playId = uuid();
  const now = Date.now();
  const events = Array.from({ length: BATCH }, (_, i) => ({
    event_id: uuid(),
    type: i === 0 ? 'playback.started' : 'playback.progress',
    occurred_at: new Date(now - (BATCH - i) * 15000).toISOString(),
    play_id: playId,
    song_id: 1,
    position_sec: i * 15,
    duration_sec: 300,
    source: { type: 'feed' },
  }));

  const res = http.post(`${API}/events`, JSON.stringify({ events }), {
    headers: { ...auth(token).headers, 'Content-Type': 'application/json' },
    tags: { name: 'POST /events' },
  });
  if (check(res, { 'accepted (202)': (r) => r.status === 202 })) {
    accepted.add(res.json('data.accepted'));
  }
  sleep(2.1); // < 30 requests per minute per user
}
