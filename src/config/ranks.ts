export type RankTier = 'Bronze' | 'Gold' | 'Platinum' | 'Diamond' | 'Crown' | 'Conqueror';

export interface RankDefinition {
  tier: RankTier;
  order: number;
  displayName: string;
  badgeUrl: string;
  colorVar: string;
  description: string;
  // TODO: Owner to specify points required to reach each rank tier
  pointsRequired: number | 'TODO';
}

export const RANKS: Record<RankTier, RankDefinition> = {
  Bronze: {
    tier: 'Bronze',
    order: 1,
    displayName: 'Bronze',
    badgeUrl: '/ranks/bronze.svg',
    colorVar: 'var(--color-rank-bronze)',
    description: 'Fresh recruit. Foundational fundamentals in algorithms or communication.',
    pointsRequired: 0,
  },
  Gold: {
    tier: 'Gold',
    order: 2,
    displayName: 'Gold',
    badgeUrl: '/ranks/gold.svg',
    colorVar: 'var(--color-rank-gold)',
    description: 'Skilled practitioner. Consistent problem solving and structured STAR responses.',
    pointsRequired: 100,
  },
  Platinum: {
    tier: 'Platinum',
    order: 3,
    displayName: 'Platinum',
    badgeUrl: '/ranks/platinum.svg',
    colorVar: 'var(--color-rank-platinum)',
    description: 'Senior engineer caliber. Fast algorithmic breakdown and clear technical leadership.',
    pointsRequired: 250,
  },
  Diamond: {
    tier: 'Diamond',
    order: 4,
    displayName: 'Diamond',
    badgeUrl: '/ranks/diamond.svg',
    colorVar: 'var(--color-rank-diamond)',
    description: 'Staff caliber. Mastery across hard dynamic programming, graph invariants, and cultural ownership.',
    pointsRequired: 500,
  },
  Crown: {
    tier: 'Crown',
    order: 5,
    displayName: 'Crown',
    badgeUrl: '/ranks/crown.svg',
    colorVar: 'var(--color-rank-crown)',
    description: 'Principal caliber. Flawless Big-O optimization and executive cross-functional leadership.',
    pointsRequired: 800,
  },
  Conqueror: {
    tier: 'Conqueror',
    order: 6,
    displayName: 'Conqueror',
    badgeUrl: '/ranks/conqueror.svg',
    colorVar: 'var(--color-rank-conqueror)',
    description: 'Elite top 0.1% tier. High-frequency contest winner and visionary tech leader.',
    pointsRequired: 1200,
  },
};

export const RANK_ORDER: RankTier[] = ['Bronze', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Conqueror'];

/**
 * Returns rank definition for a tier. Defaults to Bronze.
 */
export function getRankDefinition(tier?: string | null): RankDefinition {
  if (!tier) {
    return RANKS.Bronze;
  }
  const t = tier.trim().toLowerCase();
  if (t === 'soldier' || t === 'bronze') return RANKS.Bronze;
  if (t === 'knight' || t === 'gold') return RANKS.Gold;
  if (t === 'platinum') return RANKS.Platinum;
  if (t === 'diamond') return RANKS.Diamond;
  if (t === 'crown') return RANKS.Crown;
  if (t === 'conqueror') return RANKS.Conqueror;

  if (tier in RANKS) {
    return RANKS[tier as RankTier];
  }
  return RANKS.Bronze;
}

/**
 * Calculates rank tier dynamically from accumulated rating points.
 */
export function calculateRankFromPoints(points: number): RankTier {
  if (points >= 1200) return 'Conqueror';
  if (points >= 800) return 'Crown';
  if (points >= 500) return 'Diamond';
  if (points >= 250) return 'Platinum';
  if (points >= 100) return 'Gold';
  return 'Bronze';
}

/**
 * Computes progression toward next rank tier.
 */
export function getNextRankProgress(points: number): {
  currentTier: RankTier;
  nextTier: RankTier | null;
  pointsInCurrentTier: number;
  pointsNeededForNext: number;
  percentage: number;
} {
  const currentTier = calculateRankFromPoints(points);
  const currentIndex = RANK_ORDER.indexOf(currentTier);

  if (currentIndex === RANK_ORDER.length - 1) {
    return {
      currentTier,
      nextTier: null,
      pointsInCurrentTier: points - (RANKS.Conqueror.pointsRequired as number),
      pointsNeededForNext: 0,
      percentage: 100,
    };
  }

  const nextTier = RANK_ORDER[currentIndex + 1];
  const currentReq = RANKS[currentTier].pointsRequired as number;
  const nextReq = RANKS[nextTier].pointsRequired as number;

  const pointsInCurrentTier = Math.max(0, points - currentReq);
  const tierSpan = nextReq - currentReq;
  const percentage = Math.min(100, Math.round((pointsInCurrentTier / tierSpan) * 100));

  return {
    currentTier,
    nextTier,
    pointsInCurrentTier,
    pointsNeededForNext: Math.max(0, nextReq - points),
    percentage,
  };
}

