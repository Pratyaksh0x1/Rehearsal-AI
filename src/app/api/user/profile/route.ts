import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase/server';
import { db, isDatabaseConfigured } from '@/db';
import { users, interviews, problemAttempts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getRankDefinition } from '@/config/ranks';
import { getCandidateProblemHistory } from '@/lib/problems/history';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();

    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    const userEmail = authUser.email;

    if (isDatabaseConfigured() && db) {
      try {
        const userRows = await db
          .select()
          .from(users)
          .where(eq(users.email, userEmail))
          .limit(1);

        if (userRows.length > 0) {
          const user = userRows[0];
          const rankDef = getRankDefinition(user.rank);

          const userInterviews = await db
            .select()
            .from(interviews)
            .where(eq(interviews.userId, user.id))
            .orderBy(desc(interviews.startedAt));

          const userAttempts = await db
            .select()
            .from(problemAttempts)
            .where(eq(problemAttempts.userId, user.id));

          const normalizeTier = (tierStr?: string | null): string => {
            if (!tierStr) return 'Bronze';
            const lower = tierStr.toLowerCase();
            if (lower.includes('gold')) return 'Gold';
            if (lower.includes('plat')) return 'Platinum';
            if (lower.includes('diam')) return 'Diamond';
            if (lower.includes('crown')) return 'Crown';
            if (lower.includes('conq')) return 'Conqueror';
            return 'Bronze';
          };

          // Auto-sync any passed technical interviews not yet tracked in problemAttempts
          const recordedInterviewIds = new Set(
            userAttempts.map((a) => a.interviewId).filter(Boolean)
          );

          for (const int of userInterviews) {
            if (
              int.type === 'Technical' &&
              (int.feedbackJson as any)?.passed === true &&
              !recordedInterviewIds.has(int.id)
            ) {
              const tier = normalizeTier(
                (int.feedbackJson as any)?.rankTier ||
                  user.technicalRank ||
                  user.rank ||
                  'Bronze'
              );
              try {
                const newAttempt = {
                  id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                  userId: user.id,
                  interviewId: int.id,
                  source: 'Rehearsal AI',
                  externalId: `interview_${int.id}`,
                  difficulty: tier,
                  solved: true,
                  submittedCode: '',
                  language: 'python',
                };
                await db.insert(problemAttempts).values(newAttempt);
                userAttempts.push(newAttempt as any);
                recordedInterviewIds.add(int.id);
              } catch (e) {
                console.error('Failed to backfill attempt for interview:', int.id, e);
              }
            }
          }

          const solvedAttempts = userAttempts.filter((a) => a.solved);

          const problemsByTier: Record<string, number> = {
            Bronze: 0,
            Gold: 0,
            Platinum: 0,
            Diamond: 0,
            Crown: 0,
            Conqueror: 0,
          };

          solvedAttempts.forEach((a) => {
            const mappedTier = normalizeTier(a.difficulty);
            problemsByTier[mappedTier] = (problemsByTier[mappedTier] || 0) + 1;
          });

          const problemHistory = await getCandidateProblemHistory(user.id);

          const techRank = user.technicalRank || user.rank || 'Bronze';
          const hrRank = user.hrRank || 'Bronze';
          const techRankDef = getRankDefinition(techRank);
          const hrRankDef = getRankDefinition(hrRank);

          return NextResponse.json({
            user: {
              ...user,
              rankDef,
              techRankDef,
              hrRankDef,
            },
            stats: {
              totalInterviews: userInterviews.length,
              totalProblemsSolved: solvedAttempts.length,
              problemsByTier,
            },
            history: userInterviews.map((int) => ({
              id: int.id,
              type: int.type,
              score: int.score,
              startedAt: int.startedAt,
              endedAt: int.endedAt,
              feedbackJson: int.feedbackJson,
            })),
            problemHistory,
          });
        }
      } catch (dbErr) {
        console.warn('Error fetching DB profile, returning mock profile:', dbErr);
      }
    }

    return NextResponse.json({
      user: {
        username: authUser?.user_metadata?.full_name || 'Candidate',
        email: userEmail,
        rank: 'Bronze',
        points: 0,
        technicalRank: 'Bronze',
        technicalPoints: 0,
        hrRank: 'Bronze',
        hrPoints: 0,
        resumeUrl: null,
        resumeText: null,
        rankDef: getRankDefinition('Bronze'),
        techRankDef: getRankDefinition('Bronze'),
        hrRankDef: getRankDefinition('Bronze'),
      },
      stats: {
        totalInterviews: 0,
        totalProblemsSolved: 0,
        problemsByTier: {
          Bronze: 0,
          Gold: 0,
          Platinum: 0,
          Diamond: 0,
          Crown: 0,
          Conqueror: 0,
        },
      },
      history: [],
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();
    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    if (!isDatabaseConfigured() || !db) {
      return NextResponse.json(
        { error: 'Database is not configured' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { username } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > 24) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 24 characters' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_ ]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, spaces, and underscores' },
        { status: 400 }
      );
    }

    const userEmail = authUser.email;

    // Check uniqueness
    const conflict = await db
      .select()
      .from(users)
      .where(eq(users.username, trimmed))
      .limit(1);

    if (conflict.length > 0 && conflict[0].email !== userEmail) {
      return NextResponse.json(
        { error: 'Username is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    await db
      .update(users)
      .set({ username: trimmed })
      .where(eq(users.email, userEmail));

    return NextResponse.json({ success: true, username: trimmed });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
