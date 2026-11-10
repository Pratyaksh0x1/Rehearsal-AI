import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/llm/rate-limit';
import { generateInterviewProblem } from '@/lib/problems/generator';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    const rate = checkRateLimit(`gen-problem-${authUser.id}`, 30);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Generation rate limit reached. Please wait ${rate.resetInSec}s` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rankTier = body.rank || body.rankTier || authUser.user_metadata?.rank || 'Bronze';
    const company = body.company || null;
    const language = body.language || 'python';
    const previousProblemTitles = Array.isArray(body.previousProblemTitles)
      ? body.previousProblemTitles
      : [];

    const result = await generateInterviewProblem({
      rankTier,
      company,
      language,
      previousProblemTitles,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[GenerateProblemAPI] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate tailored problem' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rankTier = searchParams.get('rank') || searchParams.get('tier') || 'Bronze';
    const company = searchParams.get('company') || null;
    const language = searchParams.get('lang') || 'python';

    const result = await generateInterviewProblem({
      rankTier,
      company,
      language,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[GenerateProblemAPI] GET Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate tailored problem' },
      { status: 500 }
    );
  }
}

