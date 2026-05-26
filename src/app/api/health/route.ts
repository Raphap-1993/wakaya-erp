import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'wakaya-erp-web',
    version: process.env.APP_VERSION ?? 'dev',
    timestamp: new Date().toISOString(),
  });
}
