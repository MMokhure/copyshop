import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`SELECT data FROM settings WHERE id = 'main'`;
    if (rows.length === 0) return NextResponse.json({});
    return NextResponse.json(rows[0].data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    await sql`
      INSERT INTO settings (id, data) VALUES ('main', ${JSON.stringify(body)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
