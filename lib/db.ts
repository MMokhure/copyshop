import { neon, NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (!_sql) {
    // Try all env var names that Vercel/Neon integration may set
    const url =
      process.env.DATABASE_URL ??
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.POSTGRES_URL ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.POSTGRES_PRISMA_URL;
    if (!url) throw new Error('No Postgres connection string found in environment variables.');
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
