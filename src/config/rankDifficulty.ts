import { RankTier } from './ranks';

export type DifficultyLevel = 'Easy' | 'Easy-Medium' | 'Medium' | 'Medium-Hard' | 'Hard';

export interface RankDifficultyConfig {
  rankTier: RankTier;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  difficultyDetailed: DifficultyLevel;
  targetComplexity: {
    time: string;
    space: string;
  };
  allowedTopics: string[];
  guidelines: string;
  constraintsCount: number;
}

export const RANK_DIFFICULTY_MAP: Record<RankTier, RankDifficultyConfig> = {
  Bronze: {
    rankTier: 'Bronze',
    difficulty: 'Easy',
    difficultyDetailed: 'Easy',
    targetComplexity: {
      time: 'O(N) or O(N log N)',
      space: 'O(1) or O(N)',
    },
    allowedTopics: [
      'Arrays',
      'Strings',
      'Hash Map / Set',
      'Two Pointers (Linear)',
      'Basic Counting & Frequency',
      'Simple Matrix Traversal',
    ],
    guidelines:
      'Foundational algorithms. Clear, straightforward logic without complex invariants or tricky DP. 1-2 loops maximum.',
    constraintsCount: 3,
  },
  Gold: {
    rankTier: 'Gold',
    difficulty: 'Easy',
    difficultyDetailed: 'Easy-Medium',
    targetComplexity: {
      time: 'O(N) or O(N log N)',
      space: 'O(N) or O(log N)',
    },
    allowedTopics: [
      'Sliding Window (Fixed & Variable)',
      'Stacks & Monotonic Stack Basics',
      'Queues / Deque',
      'Binary Search on Sorted Arrays',
      'Binary Trees (Traversal, Depth, Inversion)',
      'Greedy Approximations',
    ],
    guidelines:
      'Standard interview problems requiring an optimal data structure choice or two-pointer window technique.',
    constraintsCount: 3,
  },
  Platinum: {
    rankTier: 'Platinum',
    difficulty: 'Medium',
    difficultyDetailed: 'Medium',
    targetComplexity: {
      time: 'O(N log N) or O(V + E)',
      space: 'O(N) or O(V)',
    },
    allowedTopics: [
      'Binary Search on Answer / Solution Space',
      'Recursion & Backtracking (Subsets, Permutations)',
      'Graphs (BFS / DFS, Connected Components, Flood Fill)',
      'Priority Queues & Heaps (Top K, Median Stream)',
      'Binary Trees (LCA, Path Sum, Diameter, Tree Serialization)',
      'Interval Merging & Overlap Scheduling',
    ],
    guidelines:
      'Senior-caliber problems testing recursive branching, graph traversals, or heap optimizations.',
    constraintsCount: 4,
  },
  Diamond: {
    rankTier: 'Diamond',
    difficulty: 'Medium',
    difficultyDetailed: 'Medium-Hard',
    targetComplexity: {
      time: 'O(N * M) or O((V + E) log V)',
      space: 'O(N * M) or O(V)',
    },
    allowedTopics: [
      'Dynamic Programming (1D & 2D Memoization/Tabulation, Knapsack variations)',
      'Topological Sort & Cycle Detection',
      'Union-Find (Disjoint Set Union with Rank & Path Compression)',
      'Shortest Path in Weighted Graphs (Dijkstra, Bellman-Ford)',
      'Trie (Prefix Trees & Word Searches)',
      'Sliding Window with Complex State Constraints',
    ],
    guidelines:
      'Staff-engineer caliber problems. Requires recognizing overlapping subproblems, invariant states, or graph connectivity structures.',
    constraintsCount: 4,
  },
  Crown: {
    rankTier: 'Crown',
    difficulty: 'Hard',
    difficultyDetailed: 'Hard',
    targetComplexity: {
      time: 'O(N log N) or O(N)',
      space: 'O(N) or O(N * 2^K)',
    },
    allowedTopics: [
      'Advanced Dynamic Programming (Bitmask DP, State Machines, Digit DP)',
      'Monotonic Deque & Queue Optimization',
      'Tries with Bitwise XOR Maximization',
      'Hard Graph Invariants (Bridges, Articulation Points, Strongly Connected Components)',
      'Segment Tree / Binary Indexed Tree (Fenwick) Concepts',
      'Advanced Matrix & Interval Scheduling',
    ],
    guidelines:
      'Principal-caliber hard problems with strict asymptotic complexity limits that fail naive approaches.',
    constraintsCount: 5,
  },
  Conqueror: {
    rankTier: 'Conqueror',
    difficulty: 'Hard',
    difficultyDetailed: 'Hard',
    targetComplexity: {
      time: 'O(N) or O(N log N)',
      space: 'O(N) or O(1) auxiliary',
    },
    allowedTopics: [
      'Multi-Paradigm Hard Problems (DP + Graph + Bit Manipulation)',
      'Optimal In-Place Memory Invariants',
      'Contest-Level Hard Algorithmic Puzzles',
      'Network Flow / Bipartite Matching Foundations',
      'String Algorithms (KMP, Rolling Hash / Rabin-Karp)',
    ],
    guidelines:
      'Top 0.1% contest-level problems. Flawless mathematical properties, strict edge bounds, and tight time limits.',
    constraintsCount: 5,
  },
};

/**
 * Normalizes any rank tier string (e.g. "Soldier" -> "Bronze", "Knight" -> "Gold")
 * and returns the difficulty configuration.
 */
export function getRankDifficultyProfile(rank?: string | null): RankDifficultyConfig {
  if (!rank) return RANK_DIFFICULTY_MAP.Bronze;

  const normalized = rank.trim().toLowerCase();

  if (normalized === 'soldier' || normalized === 'bronze') {
    return RANK_DIFFICULTY_MAP.Bronze;
  }
  if (normalized === 'knight' || normalized === 'gold') {
    return RANK_DIFFICULTY_MAP.Gold;
  }
  if (normalized === 'platinum') {
    return RANK_DIFFICULTY_MAP.Platinum;
  }
  if (normalized === 'diamond') {
    return RANK_DIFFICULTY_MAP.Diamond;
  }
  if (normalized === 'crown') {
    return RANK_DIFFICULTY_MAP.Crown;
  }
  if (normalized === 'conqueror') {
    return RANK_DIFFICULTY_MAP.Conqueror;
  }

  return RANK_DIFFICULTY_MAP.Bronze;
}

