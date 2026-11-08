import { NextRequest, NextResponse } from 'next/server';
import { db, isDatabaseConfigured } from '@/db';
import { users } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { getRankDefinition, RankTier } from '@/config/ranks';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const league = (searchParams.get('league') || 'technical').toLowerCase();
    const tier = searchParams.get('tier') as RankTier | null;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const offset = (page - 1) * limit;

    let items: any[] = [];
    let totalCount = 0;

    const isHrLeague = league === 'hr';

    if (isDatabaseConfigured() && db) {
      try {
        let query = db.select().from(users);

        if (tier) {
          query = isHrLeague
            ? (db.select().from(users).where(eq(users.hrRank, tier)) as any)
            : (db.select().from(users).where(eq(users.technicalRank, tier)) as any);
        }

        const rows = await query
          .orderBy(
            desc(isHrLeague ? users.hrPoints : users.technicalPoints),
            users.createdAt
          )
          .limit(limit)
          .offset(offset);

        items = rows.map((u, idx) => {
          const userRank = isHrLeague ? u.hrRank : u.technicalRank || u.rank;
          const userPoints = isHrLeague ? u.hrPoints : u.technicalPoints ?? u.points;
          const rankDef = getRankDefinition(userRank);

          return {
            position: offset + idx + 1,
            userId: u.id,
            username: u.username || 'Anonymous',
            league: isHrLeague ? 'hr' : 'technical',
            rank: userRank,
            rankBadge: rankDef.badgeUrl,
            points: userPoints,
          };
        });

        const countRes = await db
          .select({ count: sql<number>`count(*)` })
          .from(users);
        totalCount = Number(countRes[0]?.count || 0);
      } catch (err) {
        console.warn('DB error fetching leaderboard, using mock data:', err);
      }
    }

    if (items.length === 0) {
      // High quality initial mock data matching PUBG-tier ladder for both leagues
      const mockTechLeaderboard = [
        { username: 'algo_warlord', rank: 'Conqueror', points: 3450 },
        { username: 'dp_sorcerer', rank: 'Crown', points: 2780 },
        { username: 'graph_master', rank: 'Crown', points: 2540 },
        { username: 'binary_blitz', rank: 'Diamond', points: 2150 },
        { username: 'stack_overflow_hero', rank: 'Diamond', points: 1980 },
        { username: 'syntax_samurai', rank: 'Platinum', points: 1540 },
        { username: 'leet_grinder_99', rank: 'Platinum', points: 1420 },
        { username: 'vector_vanguard', rank: 'Gold', points: 980 },
        { username: 'pointer_padawan', rank: 'Gold', points: 850 },
        { username: 'fresh_recruit', rank: 'Bronze', points: 350 },
        { username: 'code_novice', rank: 'Bronze', points: 120 },
      ];

      const mockHrLeaderboard = [
        { username: 'star_storyteller', rank: 'Conqueror', points: 3600 },
        { username: 'conflict_mediator', rank: 'Crown', points: 2950 },
        { username: 'culture_champion', rank: 'Crown', points: 2650 },
        { username: 'empathy_engineer', rank: 'Diamond', points: 2280 },
        { username: 'leadership_lighthouse', rank: 'Diamond', points: 1950 },
        { username: 'crossfunctional_hero', rank: 'Platinum', points: 1620 },
        { username: 'feedback_sponge', rank: 'Platinum', points: 1380 },
        { username: 'clarity_crusader', rank: 'Gold', points: 920 },
        { username: 'active_listener', rank: 'Gold', points: 780 },
        { username: 'team_rookie', rank: 'Bronze', points: 290 },
        { username: 'speech_starter', rank: 'Bronze', points: 110 },
      ];

      const selectedMock = isHrLeague ? mockHrLeaderboard : mockTechLeaderboard;

      const filtered = tier
        ? selectedMock.filter((m) => m.rank.toLowerCase() === tier.toLowerCase())
        : selectedMock;

      totalCount = filtered.length;
      items = filtered.slice(offset, offset + limit).map((item, idx) => ({
        position: offset + idx + 1,
        userId: `mock_${league}_${idx}`,
        username: item.username,
        league: isHrLeague ? 'hr' : 'technical',
        rank: item.rank,
        rankBadge: getRankDefinition(item.rank).badgeUrl,
        points: item.points,
      }));
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
