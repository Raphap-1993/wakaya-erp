// k6 load test baseline.
// Uso: k6 run tests/load/health-load.js
//
// Objetivo SLO: p95 < 400ms, error_rate < 1%.

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<400'],
  },
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      tags: { scenario: 'smoke' },
    },
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      tags: { scenario: 'ramp' },
      startTime: '1m',
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/api/health`);
  check(res, {
    'status 200': (r) => r.status === 200,
    'body ok': (r) => r.body && r.body.includes('ok'),
  });
  sleep(1);
}
