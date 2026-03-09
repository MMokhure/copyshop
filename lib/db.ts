import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Lazy singleton — neon() is only called when first query runs, not at module load.
// This prevents build-time crashes when DATABASE_URL is not set locally.
let _sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL environment variable is not set.');
    _sql = neon(url);
  }
  return _sql;
}

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
