import { RankTier } from './ranks';

export interface CodeforcesRatingRange {
  // TODO: Owner note '1200 to 1100' is ambiguous. Define clear min and max rating.
  minRating: number | 'TODO';
  maxRating: number | 'TODO';
}

export interface RankProblemConfig {
  tier: RankTier;
  sources: ('LeetCode' | 'Codeforces')[];
  difficulties: ('Easy' | 'Medium' | 'Hard')[];
  topics: string[];
  codeforcesRating?: CodeforcesRatingRange;
  description: string;
}

export const PROBLEM_POOLS: Record<RankTier, RankProblemConfig> = {
  Bronze: {
    tier: 'Bronze',
    sources: ['LeetCode'],
    difficulties: ['Easy', 'Medium'],
    topics: ['Arrays', 'Strings'],
    description: 'LeetCode Easy to Medium, mostly Arrays and Strings',
  },
  Gold: {
    tier: 'Gold',
    sources: ['LeetCode'],
    difficulties: ['Medium'],
    topics: [
      'Arrays',
      'Strings',
      'Hashing',
      'Two Pointers',
      'Sliding Window',
      'Stack',
      'Queue',
      'Binary Search',
    ],
    description: 'LeetCode Medium, widen topics (hashing, two pointers, sliding window, stack/queue, binary search)',
  },
  Platinum: {
    tier: 'Platinum',
    sources: ['LeetCode'],
    difficulties: ['Medium', 'Hard'],
    topics: [
      'Trees',
      'Binary Search Trees',
      'Linked Lists',
      'Recursion',
      'Backtracking',
      'Graphs',
      'Dynamic Programming',
    ],
    description: 'LeetCode Medium to Hard (trees, linked lists, recursion/backtracking, intro graphs and DP)',
  },
  Diamond: {
    tier: 'Diamond',
    sources: ['LeetCode', 'Codeforces'],
    difficulties: ['Hard'],
    topics: ['Graphs', 'Dynamic Programming', 'Advanced Data Structures'],
    codeforcesRating: {
      // TODO: Clarify Codeforces min/max rating (note '1200 to 1100' was ambiguous)
      minRating: 'TODO',
      maxRating: 'TODO',
    },
    description: 'LeetCode Graph and DP Hard, plus Codeforces problems',
  },
  Crown: {
    tier: 'Crown',
    sources: ['LeetCode', 'Codeforces'],
    difficulties: ['Hard'],
    topics: ['Advanced Graphs', 'Dynamic Programming', 'Network Flow', 'Greedy', 'Segment Trees'],
    codeforcesRating: {
      // TODO: Clarify Codeforces min/max rating for Crown
      minRating: 'TODO',
      maxRating: 'TODO',
    },
    description: 'LeetCode Hard + Codeforces',
  },
  Conqueror: {
    tier: 'Conqueror',
    sources: ['LeetCode', 'Codeforces'],
    difficulties: ['Hard'],
    topics: ['Competitive Programming Masterclass', 'Hard DP', 'Advanced Graph Theory', 'Number Theory', 'Geometry'],
    codeforcesRating: {
      // TODO: Clarify Codeforces min/max rating for Conqueror
      minRating: 'TODO',
      maxRating: 'TODO',
    },
    description: 'LeetCode Hard + harder Codeforces',
  },
};

