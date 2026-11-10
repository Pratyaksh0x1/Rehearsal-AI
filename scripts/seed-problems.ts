if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (error) {
    console.warn('Could not load .env; using environment variables already present.', error);
  }
}

async function main() {
  const targetCount = Number(process.env.PROBLEM_BANK_SIZE || 72);
  if (!Number.isInteger(targetCount) || targetCount < 50 || targetCount > 100) {
    throw new Error('PROBLEM_BANK_SIZE must be an integer between 50 and 100.');
  }

  const [{ RANK_DIFFICULTY_MAP }, { generateInterviewProblemForBank }, database] =
    await Promise.all([
      import('../src/config/rankDifficulty'),
      import('../src/lib/problems/generator'),
      import('../src/db'),
    ]);

  if (!database.isDatabaseConfigured() || !database.db) {
    throw new Error('A valid DATABASE_URL is required to seed the problem bank.');
  }

  const slots = Object.values(RANK_DIFFICULTY_MAP).flatMap((profile) =>
    profile.allowedTopics.map((topic) => ({ rankTier: profile.rankTier, topic }))
  );
  const existing = await database.db
    .select({ title: database.schema.problemBank.title })
    .from(database.schema.problemBank);
  const generatedTitles = existing.map((problem) => problem.title);
  let insertedCount = 0;
  let duplicateCount = 0;

  console.log(`Generating ${targetCount} verified problems across ${slots.length} rank/topic combinations.`);

  for (let index = 0; index < targetCount; index++) {
    const slot = slots[index % slots.length];
    const { bankRecord } = await generateInterviewProblemForBank({
      rankTier: slot.rankTier,
      topic: slot.topic,
      previousProblemTitles: generatedTitles,
    });

    const inserted = await database.db
      .insert(database.schema.problemBank)
      .values({
        id: bankRecord.id,
        rankTier: bankRecord.rankTier,
        difficulty: bankRecord.difficulty,
        topic: slot.topic,
        title: bankRecord.title,
        payload: bankRecord,
      })
      .onConflictDoNothing()
      .returning({ id: database.schema.problemBank.id });

    generatedTitles.push(bankRecord.title);
    if (inserted.length > 0) {
      insertedCount++;
      console.log(
        `[${index + 1}/${targetCount}] Saved ${slot.rankTier} / ${slot.topic}: ${bankRecord.title}`
      );
    } else {
      duplicateCount++;
      console.warn(
        `[${index + 1}/${targetCount}] Skipped duplicate ${slot.rankTier} / ${slot.topic}: ${bankRecord.title}`
      );
    }
  }

  console.log(`Problem bank seeding finished: ${insertedCount} saved, ${duplicateCount} duplicate(s) skipped.`);
}

main().catch((error) => {
  console.error('Problem bank seeding failed:', error);
  process.exitCode = 1;
});
