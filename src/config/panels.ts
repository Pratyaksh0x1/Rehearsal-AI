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
}

/**
 * 8 interviewer personas. Persona name/avatar/personality are ours; the spoken voice is a REAL voice from
 * Gnani's Timbre v2.5 catalog (docs.gnani.ai/api/TTS/available-voices).
 *
 * IMPORTANT: Gnani no longer accepts model 'timbre-v2.0', and Shubhra / Arjun / Meera / Rohan are NOT voices in
 * the catalog - sending them returned HTTP 400 and the app silently fell back to no audio. English v2.5 voices:
 * Kaveri, Trupti, Devika (female) and Pranav, Shlok, Girish (male). For more variety switch a persona to
 * model 'timbre-v3.0' with a v3.0 voice (Shivani, Avinash, ...), if your key has access.
 */
export const AI_PANELISTS: AIPanelist[] = [
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
    id: 'arjun',
    name: 'Arjun',
    voice: 'Girish', // valid Timbre v2.5 English voice
    model: 'timbre-v2.5',
    voiceId: 'Girish',
    role: 'Competitive Programming Master',
    category: 'technical',
    specialty: 'Data Structures, Binary Search & Monotonic Stacks',
    avatarUrl: '/avatars/arjun.jpg',
    bio: 'Dynamic interviewer challenging you to eliminate redundant work and write clean optimal solutions.',
    personality: 'Energetic and sharp, offers micro-hints only when candidates hit conceptual walls.',
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
