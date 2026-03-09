import { NextResponse } from 'next/server';

export async function GET() {
  // Shows which DB env vars are present (values hidden for security)
  const vars = [
    'DATABASE_URL',
    'DATABASE_URL_UNPOOLED',
    'POSTGRES_URL',
    'POSTGRES_URL_NON_POOLING',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_HOST',
    'NEON_PROJECT_ID',
  ];
  const present: Record<string, boolean> = {};
  for (const v of vars) {
    present[v] = !!process.env[v];
  }

  // Try a simple DB query
  let dbStatus = 'not tested';
  try {
    const { getDb } = await import('@/lib/db');
    const db = getDb();
    await db`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = String(err);
  }

  return NextResponse.json({ envVars: present, dbStatus });
}
