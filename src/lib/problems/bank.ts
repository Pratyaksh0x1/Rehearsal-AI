import { eq } from 'drizzle-orm';
import { getRankDifficultyProfile } from '@/config/rankDifficulty';
import { db, isDatabaseConfigured, schema } from '@/db';
import type { GeneratedProblemBankRecord, GeneratedProblemResponse } from './generator';
import { saveProblemSession } from './session';

function isBankRecord(value: unknown): value is GeneratedProblemBankRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    typeof record.difficulty === 'string' &&
    Array.isArray(record.topics) &&
    typeof record.description === 'string' &&
    Array.isArray(record.test_cases) &&
    record.test_cases.length >= 5 &&
    typeof record.referenceSolutionPython === 'string' &&
    typeof record.starterCode === 'object' &&
    record.starterCode !== null
  );
}

export async function getBankedInterviewProblem(
  rankTier: string,
  previousTitles: string[] = []
): Promise<GeneratedProblemResponse | null> {
  if (!isDatabaseConfigured() || !db) return null;

  const rank = getRankDifficultyProfile(rankTier).rankTier;
  const rows = await db
    .select({ payload: schema.problemBank.payload })
    .from(schema.problemBank)
    .where(eq(schema.problemBank.rankTier, rank));

  const available = rows.map((row) => row.payload).filter(isBankRecord);
  if (available.length === 0) return null;

  const excludedTitles = new Set(previousTitles.map((title) => title.trim().toLowerCase()));
  const fresh = available.filter(
    (problem) => !excludedTitles.has(problem.title.trim().toLowerCase())
  );
  const pool = fresh.length > 0 ? fresh : available;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  return createProblemSession(selected);
}

export async function restoreBankedProblem(
  problemId: string
): Promise<GeneratedProblemResponse | null> {
  if (!isDatabaseConfigured() || !db) return null;
  const rows = await db
    .select({ payload: schema.problemBank.payload })
    .from(schema.problemBank)
    .where(eq(schema.problemBank.id, problemId))
    .limit(1);
  const selected = rows[0]?.payload;
  return isBankRecord(selected) ? createProblemSession(selected) : null;
}

function createProblemSession(selected: GeneratedProblemBankRecord): GeneratedProblemResponse {
  const problemSessionId = saveProblemSession(selected);

  return {
    problemSessionId,
    problem: {
      id: selected.id,
      source: selected.source,
      title: selected.title,
      difficulty: selected.difficulty,
      topics: selected.topics,
      rankTier: selected.rankTier,
      company_tags: selected.company_tags,
      description: selected.description,
      constraints: selected.constraints,
      examples: selected.examples,
      functionSpec: selected.functionSpec,
      unorderedOutput: selected.unorderedOutput,
      starterCode: selected.starterCode,
      test_cases: selected.test_cases.filter((testCase) => !testCase.is_hidden),
    },
  };
}
