import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getNextProblemForCandidate,
  getCandidateProblemHistory,
  getCandidateStats,
  getProblemsByTier,
  getAllProblems,
} from '@/lib/problems/history';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get('tier') || 'Bronze';
    const mode = searchParams.get('mode'); // 'next' | 'history' | 'stats' | null
    const difficulty = searchParams.get('difficulty');
    const company = searchParams.get('company');
    let userId = searchParams.get('userId');

    // If userId not provided in query param, attempt to resolve from Supabase session
    if (!userId) {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (authErr) {
        // Unauthenticated or local request
      }
    }

    // 1. Next Non-Repeating Problem for this candidate
    if (mode === 'next') {
      const nextResult = await getNextProblemForCandidate({
        userId,
        rankTier: tier,
        difficulty,
        company,
      });
      return NextResponse.json(nextResult);
    }

    // 2. Full Attempt History for candidate
    if (mode === 'history') {
      if (!userId) {
        return NextResponse.json({ history: [], message: 'No candidate userId provided' });
      }
      const history = await getCandidateProblemHistory(userId);
      return NextResponse.json({ history });
    }

    // 3. Aggregate Stats for candidate
    if (mode === 'stats') {
      if (!userId) {
        return NextResponse.json({
          stats: { totalAttempts: 0, totalSolved: 0, unsolvedCount: 0 },
        });
      }
      const stats = await getCandidateStats(userId);
      return NextResponse.json({ stats });
    }

    // 4. Default: Problem list for the tier
    const problems = tier ? await getProblemsByTier(tier) : await getAllProblems();
    return NextResponse.json({ problems, total: problems.length });
  } catch (error: any) {
    console.error('Problems API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process problems request' },
      { status: 500 }
    );
  }
}
