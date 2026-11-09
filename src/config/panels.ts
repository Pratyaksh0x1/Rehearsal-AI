export interface AIPanelist {
  id: string;
  name: string;
  voice: string; // Gnani official voice parameter
  model: string; // Gnani TTS model (timbre-v2.5 / timbre-v3.0)
  voiceId: string;
  role: string;
  category: 'technical' | 'hr' | 'resume';
  specialty: string;
  avatarUrl: string;
  bio: string;
  personality: string;
  mode?: 'Warm-up' | 'Real round';
  tagline?: string;
}

/**
 * Interviewer personas with authentic studio portraits and verified Gnani voices.
 */
export const AI_PANELISTS: AIPanelist[] = [
  {
    id: 'arjun',
    name: 'Arjun',
    voice: 'Girish', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Girish',
    role: 'Staff Algorithms Coach',
    category: 'technical',
    specialty: 'Data Structures, Binary Search & Optimization',
    avatarUrl: '/avatars/arjun.jpg',
    bio: 'Dynamic interviewer challenging you to eliminate redundant work and write clean optimal solutions.',
    personality: 'Friendly and patient. A good first interview.',
    mode: 'Warm-up',
    tagline: 'Friendly and patient. A good first interview.',
  },
  {
    id: 'tanya',
    name: 'Tanya',
    voice: 'Kaveri', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Kaveri',
    role: 'Algorithms Specialist & Mentor',
    category: 'technical',
    specialty: 'Brute Force to Optimal Transitions, Arrays & Strings',
    avatarUrl: '/avatars/tanya.jpg',
    bio: 'Supportive mentor helping candidates build confidence with structured problem decomposition.',
    personality: 'Patient and encouraging, offers gentle hints when you stall.',
    mode: 'Warm-up',
    tagline: 'Brute force is fine to start. Hints when you stall.',
  },
  {
    id: 'samarth',
    name: 'Samarth',
    voice: 'Pranav', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Pranav',
    role: 'Senior Staff Systems Architect',
    category: 'technical',
    specialty: 'Distributed Systems, High Concurrency & Production Trade-offs',
    avatarUrl: '/avatars/samarth.jpg',
    bio: 'Realistic company interviewer evaluating production readiness, memory footprint, and exact metrics.',
    personality: 'Methodical and precise. Wants concrete specifics, not claims.',
    mode: 'Real round',
    tagline: 'A real company round. Wants specifics, not claims.',
  },
  {
    id: 'riddhi',
    name: 'Riddhi',
    voice: 'Trupti', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Trupti',
    role: 'Lead Backend Engineer & Evaluator',
    category: 'technical',
    specialty: 'Graph Algorithms, Scale Dynamics & Failure Modes',
    avatarUrl: '/avatars/riddhi.jpg',
    bio: 'In-depth tech round evaluator probing edge cases, failure recovery, and architectural durability.',
    personality: 'Thorough and discerning. Tests edge cases and scale.',
    mode: 'Real round',
    tagline: 'Rigorous technical probe. Tests edge cases and scale.',
  },
  {
    id: 'pranav',
    name: 'Pranav',
    voice: 'Pranav', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Pranav',
    role: 'Staff Systems Architect',
    category: 'technical',
    specialty: 'Low-Latency Engines, Concurrency & Distributed Systems',
    avatarUrl: '/avatars/pranav.jpg',
    bio: 'Bold, grounded interviewer testing your architectural intuition, memory barriers, and edge cases.',
    personality: 'Rigorous and direct, values clean modular code and precise Big-O reasoning.',
    mode: 'Real round',
    tagline: 'A real company round. Tests concurrency and architectural intuition.',
  },
  {
    id: 'kaveri',
    name: 'Kaveri',
    voice: 'Kaveri', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Kaveri',
    role: 'Lead Algorithms Specialist',
    category: 'technical',
    specialty: 'Graph Theory, Dynamic Programming & Backtracking',
    avatarUrl: '/avatars/kaveri.jpg',
    bio: 'Bright, inquisitive FAANG veteran who probes step-by-step problem decomposition and subproblem transitions.',
    personality: 'Encouraging yet uncompromising on algorithmic efficiency and clean variable naming.',
  },
  {
    id: 'shubhra',
    name: 'Shubhra',
    voice: 'Trupti', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Trupti',
    role: 'Senior Behavioral & Talent Partner',
    category: 'hr',
    specialty: 'STAR Protocol, Leadership & Conflict Management',
    avatarUrl: '/avatars/shubhra.jpg',
    bio: 'Expressive and empathetic interviewer seeking genuine ownership, collaboration, and measurable outcomes.',
    personality: 'Warm, conversational, and keenly observant of communication structure and humility.',
  },
  {
    id: 'deepak',
    name: 'Deepak',
    voice: 'Shlok', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Shlok',
    role: 'Principal Backend Engineer',
    category: 'technical',
    specialty: 'Database Internals, Query Optimization & API Scalability',
    avatarUrl: '/avatars/deepak.jpg',
    bio: 'Conversational mentor assessing real-world backend reliability, caching strategies, and data trade-offs.',
    personality: 'Practical and methodical, asks probing "what if this scales 100x" follow-ups.',
  },
  {
    id: 'nalini',
    name: 'Nalini',
    voice: 'Trupti', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Trupti',
    role: 'Staff Resume & Career Strategist',
    category: 'resume',
    specialty: 'ATS Optimization, Metric-Driven Bullets & Impact Framing',
    avatarUrl: '/avatars/nalini.jpg',
    bio: 'Sharp recruiter analyzing resumes line-by-line to convert passive bullet points into high-signal achievements.',
    personality: 'Analytical and laser-focused on quantifiable engineering results.',
  },
  {
    id: 'vivan',
    name: 'Vivan',
    voice: 'Pranav', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Pranav',
    role: 'Principal Systems Architect',
    category: 'technical',
    specialty: 'High-Scale Concurrency, Graph Theory & Micro-Optimizations',
    avatarUrl: '/avatars/vivan.jpg',
    bio: 'Principal engineer evaluating deep algorithmic mastery, memory safety, and high-throughput trade-offs.',
    personality: 'Rigorous and discerning. Probes scale limits, edge conditions, and complexity lower-bounds.',
    mode: 'Real round',
    tagline: 'Principal engineering probe. Demands optimal complexity and scale.',
  },
  {
    id: 'shreya',
    name: 'Shreya',
    voice: 'Trupti', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Trupti',
    role: 'Principal Infrastructure Engineer',
    category: 'technical',
    specialty: 'Distributed Algorithms, Dynamic Programming & Fault Tolerance',
    avatarUrl: '/avatars/shreya.jpg',
    bio: 'Principal tech lead testing multi-faceted system trade-offs and robust edge case proofs.',
    personality: 'Sharp, inquisitive, and challenges candidates to rigorously prove their invariants.',
    mode: 'Real round',
    tagline: 'Principal-level probe. Tests invariants, memory barriers, and proof of optimality.',
  },
  {
    id: 'meera',
    name: 'Meera',
    voice: 'Devika', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Devika',
    role: 'Engineering Director & Culture Lead',
    category: 'hr',
    specialty: 'Strategic Vision, Cross-Team Dynamics & Delivery Ownership',
    avatarUrl: '/avatars/meera.jpg',
    bio: 'Experienced hiring manager evaluating how you navigate ambiguity, prioritize scope, and lift team velocity.',
    personality: 'Insightful, executive presence, evaluates high-level maturity and cultural alignment.',
  },
  {
    id: 'rohan',
    name: 'Rohan',
    voice: 'Pranav', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Pranav',
    role: 'Staff Full-Stack Architect',
    category: 'technical',
    specialty: 'Full-Stack Performance, State Machines & System Boundaries',
    avatarUrl: '/avatars/rohan.jpg',
    bio: 'Hands-on engineer bridging algorithmic correctness with practical production implementation.',
    personality: 'Pragmatic, friendly, and focuses on readable production-grade code.',
  },
];

/**
 * Returns a randomly picked agent.
 * Supports filtering by category (e.g. 'technical', 'hr', 'resume').
 * Users encounter random agent switches across different test attempts.
 */
export function getRandomAgent(category?: 'technical' | 'hr' | 'resume'): AIPanelist {
  const pool = category
    ? AI_PANELISTS.filter((p) => p.category === category)
    : AI_PANELISTS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Returns an array of random distinct agents (defaults to 3 or 4) for page display.
 */
export function getRandomAgents(count: number = 3): AIPanelist[] {
  const shuffled = [...AI_PANELISTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Returns an agent by ID, or fallback.
 */
export function getAgentById(id: string): AIPanelist | undefined {
  return AI_PANELISTS.find((p) => p.id.toLowerCase() === id.toLowerCase());
}

/**
 * Returns an agent from a chosen interviewer pair (e.g. 'arjun-tanya', 'samarth-riddhi', 'vivan-shreya').
 */
export function getAgentForPair(pair: 'arjun-tanya' | 'samarth-riddhi' | 'vivan-shreya' | string): AIPanelist {
  let candidateIds: string[] = [];
  if (pair === 'arjun-tanya') candidateIds = ['arjun', 'tanya'];
  else if (pair === 'samarth-riddhi') candidateIds = ['samarth', 'riddhi'];
  else if (pair === 'vivan-shreya') candidateIds = ['vivan', 'shreya'];
  else candidateIds = ['arjun', 'tanya'];

  const pickedId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
  return getAgentById(pickedId) || AI_PANELISTS[0];
}
