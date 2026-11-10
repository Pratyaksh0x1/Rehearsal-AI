import { db, isDatabaseConfigured } from '@/db';
import { problems, problemAttempts } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getFallbackProblemForRank } from './generator';

export interface TestCase {
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

export interface Problem {
  id: string;
  source: string;
  externalId?: string;
  title: string;
  url?: string;
  difficulty: string;
  topics: string[];
  rankTier: string;
  company_tags?: string[];
  description?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  constraints?: string[];
  starter_code?: { python: string; javascript: string; cpp: string; java: string };
  starterCode?: { python: string; javascript: string; typescript?: string; cpp: string; java: string };
  test_cases?: TestCase[];
  hints?: string[];
  optimal_complexity?: { time: string; space: string };
}

/**
 * Enriches a basic Problem entity with full specifications, examples,
 * starter code, and test cases.
 */
export function enrichProblemWithDetails(p: Problem): Problem {
  // If problem is already fully specified by the dynamic LLM generator, return directly
  if (p.description && (p.starter_code || (p as any).starterCode) && p.test_cases?.length) {
    return {
      ...p,
      source: p.source || 'Rehearsal AI',
      hints: [],
    };
  }

  // Fallback rank problem
  const fallback = getFallbackProblemForRank(p.rankTier || 'Bronze', p.topics?.[0] || 'algorithms');

  return {
    ...p,
    title: p.title || fallback.title,
    description: p.description || fallback.description,
    examples: p.examples || fallback.examples,
    constraints: p.constraints || fallback.constraints,
    starter_code: p.starter_code || (p as any).starterCode || fallback.starter_code,
    test_cases: p.test_cases || fallback.test_cases,
    hints: [],
    company_tags: p.company_tags || fallback.company_tags || ['General'],
    source: p.source || 'Rehearsal AI',
    url: '',
  };
}

export interface ProblemHistoryRecord {
  attemptId: string;
  userId: string;
  interviewId?: string | null;
  problemId?: string | null;
  externalId: string;
  source: string;
  title?: string;
  url?: string;
  difficulty?: string;
  topics?: string[];
  rankTier?: string;
  solved: boolean;
  submittedCode?: string | null;
  language?: string | null;
  createdAt: Date | string;
}

export interface NextProblemResult {
  problem: Problem;
  isRepeat: boolean;
  remainingUnattempted: number;
  totalInTier: number;
  attemptCountForUser: number;
}

export interface CandidateStats {
  totalAttempts: number;
  totalSolved: number;
  unsolvedCount: number;
  solvedByDifficulty: {
    Easy: number;
    Medium: number;
    Hard: number;
  };
  solvedByTier: Record<string, number>;
}

/**
 * Normalizes rank tier string for case-insensitive matching.
 */
function normalizeTier(tier?: string | null): string {
  if (!tier) return 'Bronze';
  const clean = tier.trim().toLowerCase();
  const map: Record<string, string> = {
    bronze: 'Bronze',
    gold: 'Gold',
    platinum: 'Platinum',
    diamond: 'Diamond',
    crown: 'Crown',
    conqueror: 'Conqueror',
  };
  return map[clean] || 'Bronze';
}

/**
 * 1. Retrieve all problem IDs that a candidate has attempted so far.
 * Used for anti-repeat filtering.
 */
export async function getCandidateAttemptedIds(userId: string): Promise<Set<string>> {
  if (!userId || !isDatabaseConfigured() || !db) {
    return new Set<string>();
  }

  try {
    const attempts = await db
      .select({
        externalId: problemAttempts.externalId,
      })
      .from(problemAttempts)
      .where(eq(problemAttempts.userId, userId));

    return new Set(attempts.map((a) => String(a.externalId)));
  } catch (err) {
    console.warn('Error fetching candidate attempted problem IDs:', err);
    return new Set<string>();
  }
}

/**
 * 2. Retrieve detailed problem attempt history for a candidate.
 * Returns past questions, code submissions, timestamps, and whether solved.
 */
export async function getCandidateProblemHistory(
  userId: string,
  limit: number = 50
): Promise<ProblemHistoryRecord[]> {
  if (!userId || !isDatabaseConfigured() || !db) {
    return [];
  }

  try {
    const attempts = await db
      .select({
        attemptId: problemAttempts.id,
        userId: problemAttempts.userId,
        interviewId: problemAttempts.interviewId,
        source: problemAttempts.source,
        externalId: problemAttempts.externalId,
        difficulty: problemAttempts.difficulty,
        solved: problemAttempts.solved,
        submittedCode: problemAttempts.submittedCode,
        language: problemAttempts.language,
        createdAt: problemAttempts.createdAt,
      })
      .from(problemAttempts)
      .where(eq(problemAttempts.userId, userId))
      .orderBy(desc(problemAttempts.createdAt))
      .limit(limit);

    // Map attempts with problem metadata for titles and URLs
    const allProblems = await getAllProblems();
    const problemMap = new Map<string, Problem>();
    for (const p of allProblems) {
      if (p.externalId) {
        problemMap.set(`${p.source}_${p.externalId}`, p);
        problemMap.set(p.externalId, p);
      }
      if (p.id) problemMap.set(p.id, p);
      if (p.title) problemMap.set(p.title, p);
    }

    return attempts.map((att) => {
      const match =
        problemMap.get(`${att.source}_${att.externalId}`) ||
        problemMap.get(att.externalId);

      return {
        ...att,
        title: match?.title || `Problem #${att.externalId}`,
        url: match?.url || '',
        topics: match?.topics || [],
        rankTier: match?.rankTier || 'Bronze',
        difficulty: att.difficulty || match?.difficulty || 'Medium',
      };
    });
  } catch (err) {
    console.error('Error fetching candidate problem history:', err);
    return [];
  }
}

/**
 * 3. Retrieve all problems available in a rank tier.
 */
export async function getProblemsByTier(tier: string): Promise<Problem[]> {
  const normalized = normalizeTier(tier);

  if (isDatabaseConfigured() && db) {
    try {
      const rows = await db
        .select()
        .from(problems)
        .where(eq(problems.rankTier, normalized));

      if (rows && rows.length > 0) {
        return rows as Problem[];
      }
    } catch (err) {
      console.warn('DB error fetching tier problems, falling back to rank generator:', err);
    }
  }

  return [getFallbackProblemForRank(normalized)];
}

/**
 * 4. Retrieve all problems across all tiers.
 */
export async function getAllProblems(): Promise<Problem[]> {
  if (isDatabaseConfigured() && db) {
    try {
      const rows = await db.select().from(problems);
      if (rows && rows.length > 0) {
        return rows as Problem[];
      }
    } catch (err) {
      console.warn('DB error fetching all problems, using rank fallbacks:', err);
    }
  }

  return ['Bronze', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Conqueror'].map((t) =>
    getFallbackProblemForRank(t)
  );
}

/**
 * 5. CORE SELECTOR:
 * Retrieves the NEXT problem for a candidate such that:
 *  - The candidate's past questions do NOT repeat.
 *  - Questions already asked to candidate A CAN STILL be asked to candidate B of the same rank.
 *  - If candidate A has exhausted all questions in their tier, it rolls over to their least-recently attempted question.
 */
export async function getNextProblemForCandidate(options: {
  userId?: string | null;
  rankTier?: string | null;
  difficulty?: string | null;
  company?: string | null;
}): Promise<NextProblemResult> {
  const allProblems = await getAllProblems();
  let candidatePool = [...allProblems];

  // 1. Filter by difficulty if provided (e.g. 'easy', 'medium', 'hard')
  if (options.difficulty && options.difficulty.toLowerCase() !== 'all') {
    const diff = options.difficulty.toLowerCase().trim();
    const diffFiltered = candidatePool.filter((p) => {
      const d = (p.difficulty || '').toLowerCase();
      if (diff === 'easy') return d === 'easy' || d === '800';
      if (diff === 'medium') return d === 'medium' || d === '1100' || d === '1200';
      if (diff === 'hard') return d === 'hard' || d === '1300';
      return d === diff;
    });
    if (diffFiltered.length > 0) {
      candidatePool = diffFiltered;
    }
  }

  // 2. Filter by company if provided (e.g. 'Google', 'Meta', 'Amazon', etc.)
  if (options.company && options.company !== 'Any company') {
    const compLower = options.company.toLowerCase().trim();
    const companyFiltered = candidatePool.filter((p) => {
      return (p.company_tags || []).some(
        (tag) => tag.toLowerCase() === compLower || tag.toLowerCase().includes(compLower)
      );
    });
    if (companyFiltered.length > 0) {
      candidatePool = companyFiltered;
    }
  }

  // 3. Fallback to rank tier if no options or pool is empty
  if (!candidatePool || candidatePool.length === 0) {
    const rankTier = normalizeTier(options.rankTier);
    candidatePool = await getProblemsByTier(rankTier);
  }

  if (!candidatePool || candidatePool.length === 0) {
    // Ultimate fallback if no problems exist in tier
    const fallbackProblem: Problem = {
      id: 'dsa-1',
      source: 'Rehearsal DSA',
      externalId: '1',
      title: 'Two Sum',
      url: '',
      difficulty: 'Easy',
      topics: ['Arrays', 'Hashing'],
      rankTier: 'Bronze',
      company_tags: ['Google', 'Meta', 'Amazon', 'Apple', 'Microsoft'],
    };
    return {
      problem: enrichProblemWithDetails(fallbackProblem),
      isRepeat: false,
      remainingUnattempted: 0,
      totalInTier: 1,
      attemptCountForUser: 0,
    };
  }

  // If no user ID is provided (e.g. unauthenticated demo), pick random from pool
  if (!options.userId) {
    const randomIndex = Math.floor(Math.random() * candidatePool.length);
    return {
      problem: enrichProblemWithDetails(candidatePool[randomIndex]),
      isRepeat: false,
      remainingUnattempted: candidatePool.length,
      totalInTier: candidatePool.length,
      attemptCountForUser: 0,
    };
  }

  // Retrieve this specific user's attempt history
  const attemptedIds = await getCandidateAttemptedIds(options.userId);

  // Filter for problems in this pool that THIS candidate has NOT yet attempted
  const unattemptedProblems = candidatePool.filter(
    (p) => !attemptedIds.has(String(p.externalId))
  );

  // CASE 1: Candidate has fresh, unattempted problems in their selected pool
  if (unattemptedProblems.length > 0) {
    const randomIndex = Math.floor(Math.random() * unattemptedProblems.length);
    const selected = unattemptedProblems[randomIndex];

    return {
      problem: enrichProblemWithDetails(selected),
      isRepeat: false,
      remainingUnattempted: unattemptedProblems.length - 1,
      totalInTier: candidatePool.length,
      attemptCountForUser: attemptedIds.size,
    };
  }

  // CASE 2: Candidate has already attempted all problems in their selected pool!
  // Pick the problem they attempted the longest time ago (least recently seen)
  try {
    const userHistory = await getCandidateProblemHistory(options.userId, 100);
    const lastAttemptTimeMap = new Map<string, number>();
    for (const h of userHistory) {
      const time = new Date(h.createdAt).getTime();
      if (!lastAttemptTimeMap.has(h.externalId)) {
        lastAttemptTimeMap.set(h.externalId, time);
      }
    }

    const sortedByOldest = [...candidatePool].sort((a, b) => {
      const timeA = lastAttemptTimeMap.get(String(a.externalId)) || 0;
      const timeB = lastAttemptTimeMap.get(String(b.externalId)) || 0;
      return timeA - timeB;
    });

    const recycledProblem = sortedByOldest[0] || candidatePool[0];

    return {
      problem: enrichProblemWithDetails(recycledProblem),
      isRepeat: true,
      remainingUnattempted: 0,
      totalInTier: candidatePool.length,
      attemptCountForUser: attemptedIds.size,
    };
  } catch (err) {
    const randomIndex = Math.floor(Math.random() * candidatePool.length);
    return {
      problem: enrichProblemWithDetails(candidatePool[randomIndex]),
      isRepeat: true,
      remainingUnattempted: 0,
      totalInTier: candidatePool.length,
      attemptCountForUser: attemptedIds.size,
    };
  }
}

/**
 * 6. Record a new problem attempt into the database.
 */
export async function recordCandidateAttempt(params: {
  userId: string;
  interviewId?: string;
  problem: Problem;
  solved: boolean;
  submittedCode: string;
  language: string;
}): Promise<boolean> {
  if (!isDatabaseConfigured() || !db || !params.userId) {
    return false;
  }

  try {
    await db.insert(problemAttempts).values({
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      interviewId: params.interviewId || null,
      source: params.problem.source || 'Rehearsal DSA',
      externalId: String(params.problem.externalId),
      difficulty: params.problem.difficulty || 'Medium',
      solved: params.solved,
      submittedCode: params.submittedCode || '',
      language: params.language || 'python',
    });
    return true;
  } catch (err) {
    console.error('Error recording candidate problem attempt:', err);
    return false;
  }
}

/**
 * 7. Retrieve aggregate statistics for candidate (total solved, difficulty breakdown).
 */
export async function getCandidateStats(userId: string): Promise<CandidateStats> {
  const stats: CandidateStats = {
    totalAttempts: 0,
    totalSolved: 0,
    unsolvedCount: 0,
    solvedByDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
    solvedByTier: {
      Bronze: 0,
      Gold: 0,
      Platinum: 0,
      Diamond: 0,
      Crown: 0,
      Conqueror: 0,
    },
  };

  if (!userId || !isDatabaseConfigured() || !db) {
    return stats;
  }

  try {
    const attempts = await db
      .select({
        externalId: problemAttempts.externalId,
        difficulty: problemAttempts.difficulty,
        solved: problemAttempts.solved,
      })
      .from(problemAttempts)
      .where(eq(problemAttempts.userId, userId));

    stats.totalAttempts = attempts.length;

    // Track unique solved problems
    const solvedSet = new Set<string>();
    for (const a of attempts) {
      if (a.solved && !solvedSet.has(a.externalId)) {
        solvedSet.add(a.externalId);
        stats.totalSolved += 1;

        const diff = (a.difficulty || 'Medium').toLowerCase();
        if (diff.includes('easy')) stats.solvedByDifficulty.Easy += 1;
        else if (diff.includes('hard')) stats.solvedByDifficulty.Hard += 1;
        else stats.solvedByDifficulty.Medium += 1;
      }
    }

    stats.unsolvedCount = Math.max(0, attempts.length - stats.totalSolved);
    return stats;
  } catch (err) {
    console.warn('Error calculating candidate stats:', err);
    return stats;
  }
}

