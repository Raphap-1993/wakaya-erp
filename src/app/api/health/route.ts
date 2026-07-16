import { NextResponse } from 'next/server';

import { getContentPersistenceHealth } from '@/lib/content/media/persistence';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'wakaya-erp-web',
    version: process.env.APP_VERSION ?? 'dev',
    persistence: getContentPersistenceHealth(),
    timestamp: new Date().toISOString(),
  });
}
