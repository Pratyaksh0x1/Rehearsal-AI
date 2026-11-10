import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { restoreBankedProblem } from '@/lib/problems/bank';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized: login required' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const problemId = typeof body.problemId === 'string' ? body.problemId : '';
  if (!problemId) {
    return NextResponse.json({ error: 'Problem ID is required' }, { status: 400 });
  }

  try {
    const restored = await restoreBankedProblem(problemId);
    if (!restored) {
      return NextResponse.json({ error: 'Problem cannot be restored' }, { status: 404 });
    }
    return NextResponse.json(restored);
  } catch (restoreError) {
    console.error('[RestoreProblemSessionAPI] Failed to restore problem session:', restoreError);
    return NextResponse.json({ error: 'Failed to restore problem session' }, { status: 500 });
  }
}
