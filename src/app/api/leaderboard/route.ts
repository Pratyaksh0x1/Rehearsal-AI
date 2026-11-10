import { NextRequest, NextResponse } from 'next/server';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { getRankDefinition, RankTier } from '@/config/ranks';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const league = (searchParams.get('league') || 'overall').toLowerCase();
    const tier = searchParams.get('tier') as RankTier | null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let items: any[] = [];
    let totalCount = 0;

    const isHrLeague = league === 'hr';
    const isTechLeague = league === 'technical';

    if (isDatabaseConfigured() && db) {
      try {
        let query = db.select().from(users);

        if (tier) {
          query = isHrLeague
            ? (db.select().from(users).where(eq(users.hrRank, tier)) as any)
            : (db.select().from(users).where(eq(users.technicalRank, tier)) as any);
        }

        const orderColumn = isHrLeague
          ? users.hrPoints
          : isTechLeague
          ? users.technicalPoints
          : users.points;

        const rows = await query
          .orderBy(
            desc(orderColumn),
            users.createdAt
          )
          .limit(limit)
          .offset(offset);

        items = rows.map((u, idx) => {
          const userRank = isHrLeague
            ? u.hrRank
            : isTechLeague
            ? (u.technicalRank || u.rank)
            : u.rank;
          const userPoints = isHrLeague
            ? (u.hrPoints ?? 0)
            : isTechLeague
            ? (u.technicalPoints ?? u.points ?? 0)
            : (u.points ?? 0);
          const rankDef = getRankDefinition(userRank || 'Bronze');

          return {
            position: offset + idx + 1,
            userId: u.id,
            username: u.username || 'Anonymous',
            league: isHrLeague ? 'hr' : isTechLeague ? 'technical' : 'overall',
            rank: userRank || 'Bronze',
            rankBadge: rankDef.badgeUrl,
            points: userPoints,
          };
        });

        const countRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(users);
        totalCount = Number(countRes[0]?.count || 0);
      } catch (err) {
        console.warn('DB error fetching leaderboard; returning an empty leaderboard:', err);
        items = [];
        totalCount = 0;
      }
    }

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
