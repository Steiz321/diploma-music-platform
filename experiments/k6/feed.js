// GET /song/recommended ("For you"): run with Recommendations up, then with
// it paused — Core must answer within its timeout with popular songs.
import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';
import { API, auth, register } from './common.js';

export const options = {
  scenarios: {
    feed: { executor: 'constant-vus', vus: 10, duration: '20s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    // a threshold on the tag also exports the endpoint's own timings
    // (without the registration requests of setup)
    'http_req_duration{name:GET /song/recommended}': ['p(95)<2000'],
  },
};

const fallback = new Counter('popular_fallback');

export function setup() {
  return { token: register('k6-feed') };
}

export default function (data) {
  const res = http.get(`${API}/song/recommended?limit=10`, {
    ...auth(data.token),
    tags: { name: 'GET /song/recommended' },
  });
  check(res, { 'ok (200)': (r) => r.status === 200 });
  if (res.status === 200 && res.json('data.source') === 'popular') {
    fallback.add(1);
  }
}
