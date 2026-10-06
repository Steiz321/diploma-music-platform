// POST /song latency: the upload returns right away (transcription and
// analysis happen asynchronously in AI enrichment).
import http from 'k6/http';
import { check } from 'k6';
import { API, auth, register } from './common.js';

export const options = {
  scenarios: {
    upload: { executor: 'constant-vus', vus: 5, duration: '30s' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    // a threshold on the tag also exports the endpoint's own timings
    // (without the registration requests of setup)
    'http_req_duration{name:POST /song}': ['p(95)<1000'],
  },
};

const AUDIO = 'x'.repeat(64 * 1024); // 64 KB dummy file

export function setup() {
  return { token: register('k6-upload') };
}

export default function (data) {
  const res = http.post(
    `${API}/song`,
    {
      name: `k6 song ${__VU}-${__ITER}`,
      audio: http.file(AUDIO, 'k6.mp3', 'audio/mpeg'),
    },
    { ...auth(data.token), tags: { name: 'POST /song' } },
  );
  check(res, { 'created (201)': (r) => r.status === 201 });
}
