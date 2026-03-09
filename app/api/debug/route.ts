import { NextResponse } from 'next/server';

export async function GET() {
  const vars = [
    'DATABASE_URL',
    'DATABASE_URL_UNPOOLED',
    'POSTGRES_URL',
    'POSTGRES_URL_NON_POOLING',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_HOST',
    'NEON_PROJECT_ID',
  ];

  const envInfo: Record<string, string> = {};
  for (const v of vars) {
    const val = process.env[v];
    if (val) {
      envInfo[v] = val.slice(0, 30) + '…'; // show partial value for diagnosis
    } else {
      envInfo[v] = '(not set)';
    }
  }

  let dbStatus = 'not tested';
  try {
    const { sql } = await import('@/lib/db');
    await sql`SELECT 1 as ok`;
    dbStatus = 'CONNECTED OK';
  } catch (err) {
    dbStatus = String(err);
  }

  return NextResponse.json({ envInfo, dbStatus });
}

