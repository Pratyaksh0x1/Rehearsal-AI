import { Problem } from './history';

// In-memory server session cache for active interview problems
type ProblemSessionRecord = { problem: Problem; createdAt: number };
type ProblemSessionGlobal = typeof globalThis & {
  __rehearsalAIProblemSessions?: Map<string, ProblemSessionRecord>;
};

const globalForProblemSessions = globalThis as ProblemSessionGlobal;
const problemSessionMap =
  globalForProblemSessions.__rehearsalAIProblemSessions ||
  (globalForProblemSessions.__rehearsalAIProblemSessions = new Map());

// Expire sessions older than 3 hours
const TTL_MS = 3 * 60 * 60 * 1000;

export function saveProblemSession(problem: Problem): string {
  cleanExpired();
  const sessionId = `psess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  problemSessionMap.set(sessionId, { problem, createdAt: Date.now() });
  return sessionId;
}

export function getProblemSession(sessionId: string): Problem | undefined {
  cleanExpired();
  const record = problemSessionMap.get(sessionId);
  return record?.problem;
}

function cleanExpired() {
  const now = Date.now();
  problemSessionMap.forEach((record, id) => {
    if (now - record.createdAt > TTL_MS) {
      problemSessionMap.delete(id);
    }
  });
}
