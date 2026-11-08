import postgres from 'postgres';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

async function addIndexes() {
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
    console.log('Adding missing foreign key indexes...');
    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "problem_attempts_interview_id_idx" 
      ON public.problem_attempts(interview_id);
    `);
    console.log('✓ Created problem_attempts_interview_id_idx');

    await sql.unsafe(`
      CREATE INDEX IF NOT EXISTS "reports_user_id_idx" 
      ON public.reports(user_id);
    `);
    console.log('✓ Created reports_user_id_idx');

    console.log('🎉 Foreign key indexes created successfully!');
  } catch (err) {
    console.error('Error adding indexes:', err);
  } finally {
    await sql.end();
  }
}

addIndexes();

