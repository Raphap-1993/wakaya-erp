// Pact consumer contract test baseline.
// Uso: npx vitest run tests/contract
// Requiere: npm install -D @pact-foundation/pact

import path from 'node:path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { describe, expect, it } from 'vitest';

const { like, eachLike, datetime, uuid } = MatchersV3;
const apiResourcePath = '/api/reservations'.startsWith('__') ? '/api/resource' : '/api/reservations';
const apiResourcePlural = 'reservations'.startsWith('__') ? 'resources' : 'reservations';
const webComponentName = 'wakaya-erp-web'.startsWith('__') ? 'web' : 'wakaya-erp-web';
const apiServiceName = 'wakaya-erp-api'.startsWith('__') ? 'api' : 'wakaya-erp-api';

const provider = new PactV3({
  consumer: webComponentName,
  provider: apiServiceName,
  dir: path.resolve(__dirname, '../../pacts'),
  logLevel: 'warn',
});

describe(`Pact contract: list ${apiResourcePlural}`, () => {
  it('returns a paginated list', async () => {
    provider
      .given(`there are active ${apiResourcePlural}`)
      .uponReceiving(`GET ${apiResourcePath}?status=open`)
      .withRequest({
        method: 'GET',
        path: apiResourcePath,
        query: { status: 'open' },
        headers: { Accept: 'application/json' },
      })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          items: eachLike({
            id: uuid(),
            status: like('open'),
            updatedAt: datetime("yyyy-MM-dd'T'HH:mm:ss.SSSX", '2026-06-03T10:15:30.000Z'),
          }),
          page: like(1),
          pageSize: like(20),
          total: like(42),
        },
      });

    await provider.executeTest(async (mockserver) => {
      const res = await fetch(
        `${mockserver.url}${apiResourcePath}?status=open`,
        { headers: { Accept: 'application/json' } },
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items.length).toBeGreaterThan(0);
    });
  });
});
