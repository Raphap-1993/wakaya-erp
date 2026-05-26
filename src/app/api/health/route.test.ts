import { describe, it, expect } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('responde con status ok y metadatos del servicio', async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('wakaya-erp-web');
    expect(typeof body.timestamp).toBe('string');
  });
});
