import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT data FROM sales_history ORDER BY ts DESC`;
    return NextResponse.json(rows.map((r) => r.data));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await sql`INSERT INTO sales_history (id, ts, data) VALUES (${body.id}, ${body.timestamp}::timestamptz, ${JSON.stringify(body)}::jsonb)`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
