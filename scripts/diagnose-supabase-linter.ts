import postgres from 'postgres';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

async function diagnose() {
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
    console.log('=== 1. ALL TABLES IN PUBLIC SCHEMA AND RLS STATUS ===');
    const tables = await sql`
      SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname;
    `;
    console.table(tables);

    console.log('\n=== 2. ALL POLICIES IN PUBLIC SCHEMA ===');
    const policies = await sql`
      SELECT 
        tablename, 
        policyname, 
        permissive, 
        roles, 
        cmd, 
        qual, 
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;
    console.table(policies);

    console.log('\n=== 3. CHECKING FOR MULTIPLE PERMISSIVE POLICIES ===');
    const duplicates = await sql`
      SELECT tablename, cmd, unnest(roles) as role, count(*) as policy_count, array_agg(policyname) as policy_names
      FROM pg_policies
      WHERE schemaname = 'public' AND permissive = 'PERMISSIVE'
      GROUP BY tablename, cmd, unnest(roles)
      HAVING count(*) > 1;
    `;
    if (duplicates.length === 0) {
      console.log('✓ No multiple permissive policies found!');
    } else {
      console.table(duplicates);
    }

    console.log('\n=== 4. CHECKING AUTH INITPLAN WARNINGS (qual or with_check containing direct auth.uid() without subselect) ===');
    for (const p of policies) {
      const q = (p.qual || '') + ' ' + (p.with_check || '');
      if (q.includes('auth.uid()') && !q.includes('SELECT auth.uid()')) {
        console.log(`⚠️ Policy ${p.policyname} on ${p.tablename} might trigger InitPlan warning:`, q);
      } else {
        console.log(`✓ Policy ${p.policyname} on ${p.tablename} is clean`);
      }
    }

    console.log('\n=== 5. CHECKING UNINDEXED FOREIGN KEYS ===');
    const unindexedFks = await sql`
      SELECT
        c.conrelid::regclass AS table_name,
        c.conname AS foreign_key_name
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND NOT EXISTS (
          SELECT 1
          FROM pg_index i
          WHERE i.indrelid = c.conrelid
            AND i.indkey[0] = c.conkey[1]
        );
    `;
    console.table(unindexedFks);

    console.log('\n=== 6. CHECKING FUNCTIONS IN PUBLIC SCHEMA ===');
    const funcs = await sql`
      SELECT p.proname, p.prosecdef, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public';
    `;
    console.table(funcs);

  } catch (err) {
    console.error('Diagnostic error:', err);
  } finally {
    await sql.end();
  }
}

diagnose();
