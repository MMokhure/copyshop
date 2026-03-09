import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (!_sql) {
    // Vercel Neon integration may provide either name
    const url = process.env.DATABASE_URL ?? process.env.DATABASE_URL_UNPOOLED;
    if (!url) throw new Error('No DATABASE_URL or DATABASE_URL_UNPOOLED env var found.');
    _sql = neon(url);
  }
  return _sql;
}

export const sql: NeonQueryFunction<false, false> = new Proxy(
  {} as NeonQueryFunction<false, false>,
  {
    apply(_t, _this, args) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (getDb() as any)(...args);
    },
    get(_t, prop) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (getDb() as any)[prop];
    },
  }
);

// Convenience proxy so callers can still write: await sql`SELECT ...`
export const sql: NeonQueryFunction<false, false> = new Proxy(
  {} as NeonQueryFunction<false, false>,
  {
    apply(_t, _this, args) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (getDb() as any)(...args);
    },
    get(_t, prop) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (getDb() as any)[prop];
    },
  }
);
