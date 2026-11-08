import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const isDatabaseConfigured = (): boolean => {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
      url.startsWith('postgres') &&
      !url.includes('[PASSWORD]') &&
      !url.includes('[HOST]')
  );
};

// Global singleton to prevent connection pool exhaustion in development
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

function createDbClient() {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const connectionString = process.env.DATABASE_URL!;

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
