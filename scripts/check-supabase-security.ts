import postgres from 'postgres';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

async function inspectSecurity() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const isPooler = databaseUrl.includes(':6543') || databaseUrl.includes('pooler');
  const sql = postgres(databaseUrl, {
    prepare: !isPooler,
    ssl: 'require',
    max: 1,
  });

  try {
    console.log('--- Inspecting Tables & RLS Status ---');
    const rlsStatus = await sql`
      SELECT 
        tablename, 
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'public';
    `;
    console.log(rlsStatus);

    console.log('\n--- Inspecting Active Policies ---');
    const policies = await sql`
      SELECT 
        tablename, 
        policyname, 
        cmd, 
        roles,
        qual
      FROM pg_policies 
      WHERE schemaname = 'public';
    `;
    console.log(policies);

    console.log('\n--- Inspecting Extensions in Public ---');
    const extensions = await sql`
      SELECT 
        extname, 
        n.nspname as schema 
      FROM pg_extension e 
      JOIN pg_namespace n ON e.extnamespace = n.oid 
      WHERE n.nspname = 'public';
    `;
    console.log(extensions);

  } catch (err) {
    console.error('Inspection error:', err);
  } finally {
    await sql.end();
  }
}

inspectSecurity();

