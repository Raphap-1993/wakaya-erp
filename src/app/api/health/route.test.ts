import { afterEach, describe, it, expect } from 'vitest';
import { GET } from './route';

const mutableEnv = process.env as Record<string, string | undefined>;
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalMediaPath = process.env.WAKAYA_MEDIA_STORAGE_PATH;

afterEach(() => {
  if (originalDatabaseUrl) mutableEnv.DATABASE_URL = originalDatabaseUrl;
  else delete mutableEnv.DATABASE_URL;
  if (originalMediaPath) mutableEnv.WAKAYA_MEDIA_STORAGE_PATH = originalMediaPath;
  else delete mutableEnv.WAKAYA_MEDIA_STORAGE_PATH;
});

describe('GET /api/health', () => {
  it('responde con status ok y metadatos del servicio', async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('wakaya-erp-web');
    expect(typeof body.timestamp).toBe('string');
  });

  it('informa si contenido y media tienen persistencia durable configurada', async () => {
    mutableEnv.DATABASE_URL = 'postgres://configured';
    mutableEnv.WAKAYA_MEDIA_STORAGE_PATH = '/srv/wakaya/media';

    const response = await GET();
    const body = await response.json();

    expect(body.persistence).toEqual({
      database: 'configured',
      mediaStorage: 'configured',
      contentWrites: 'durable',
    });
    expect(JSON.stringify(body)).not.toContain('postgres://configured');
    expect(JSON.stringify(body)).not.toContain('/srv/wakaya/media');
  });

  it('marca como insegura una ruta de media dentro del release', async () => {
    mutableEnv.DATABASE_URL = 'postgres://configured';
    mutableEnv.WAKAYA_MEDIA_STORAGE_PATH = '.data/wakaya-media';

    const response = await GET();
    const body = await response.json();

    expect(body.persistence.mediaStorage).toBe('unsafe');
    expect(body.persistence.contentWrites).toBe('not-durable');
  });
});
