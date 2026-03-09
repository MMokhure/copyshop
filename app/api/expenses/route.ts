import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT data FROM expenses ORDER BY (data->>'createdAt') DESC`;
    return NextResponse.json(rows.map((r) => r.data));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await sql`INSERT INTO expenses (id, data) VALUES (${body.id}, ${JSON.stringify(body)}::jsonb)`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
