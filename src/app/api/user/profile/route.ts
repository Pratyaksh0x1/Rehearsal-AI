import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db, isDatabaseConfigured } from '@/db';
import { users, interviews, problemAttempts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getRankDefinition } from '@/config/ranks';
import { getCandidateProblemHistory } from '@/lib/problems/history';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const userEmail = authUser?.email;

    if (!userEmail) {
      // Return default guest / candidate profile data
      return NextResponse.json({
        user: {
          username: 'Guest Candidate',
          email: 'candidate@example.com',
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
    }

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
            const diff = a.difficulty || 'Bronze';
            if (diff in problemsByTier) {
              problemsByTier[diff]++;
            } else {
              problemsByTier.Bronze++;
            }
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
