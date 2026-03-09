import { neon } from '@neondatabase/serverless';

function getUrl(): string {
  return (
    process.env.DATABASE_URL ??
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_PRISMA_URL ??
    ''
  );
}

export function getDb() {
  const url = getUrl();
  if (!url) throw new Error('No DB connection string found in environment.');
  return neon(url);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql = (strings: TemplateStringsArray, ...params: any[]) => getDb()(strings, ...params);
