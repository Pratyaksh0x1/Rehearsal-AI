import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const getCleanDatabaseUrl = (): string | undefined => {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  return raw.trim().replace(/^["']|["']$/g, '');
};

export const isDatabaseConfigured = (): boolean => {
  const url = getCleanDatabaseUrl();
  return Boolean(
    url &&
      (url.startsWith('postgres://') || url.startsWith('postgresql://')) &&
      !url.includes('[PASSWORD]') &&
      !url.includes('[HOST]') &&
      !url.includes('placeholder')
  );
};

// Global singleton to prevent connection pool exhaustion in development
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

function createDbClient() {
  if (!isDatabaseConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '⚠️ DATABASE_URL is not configured or contains placeholder values. Database persistence is disabled.'
      );
    }
    return null;
  }

  const connectionString = getCleanDatabaseUrl()!;

  // When connecting via Supabase connection pooler (port 6543 / Transaction mode),
  // prepare: false is required to avoid prepared statement caching conflicts.
  const isPooler =
    connectionString.includes(':6543') || connectionString.includes('pooler');

  const client =
    globalForDb.conn ??
    postgres(connectionString, {
      prepare: !isPooler,
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.conn = client;
  }

  return drizzle(client, { schema });
}

export const db = createDbClient();
export { schema };
