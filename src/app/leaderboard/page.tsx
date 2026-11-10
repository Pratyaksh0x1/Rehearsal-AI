'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getRankDefinition } from '@/config/ranks';
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  Shield,
  Award,
  Code2,
  Users,
  Sparkles,
  Info,
} from 'lucide-react';
import { AuthGate } from '@/components/auth/AuthGate';

interface LeaderboardUser {
  position: number;
  userId: string;
  username: string;
  league: string;
  rank: string;
  rankBadge: string;
  points: number;
}

export default function LeaderboardPage() {
  return (
    <AuthGate>
      <LeaderboardContent />
    </AuthGate>
  );
}

function LeaderboardContent() {
  const [activeLeague, setActiveLeague] = useState<'technical' | 'hr'>('technical');
  const [page, setPage] = useState(1);
  const [leaderboardData, setLeaderboardData] = useState<{
    items: LeaderboardUser[];
    pagination: { page: number; totalPages: number; totalCount: number };
  }>({
    items: [],
    pagination: { page: 1, totalPages: 1, totalCount: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/leaderboard?league=${activeLeague}&page=${page}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setLeaderboardData(data);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
  }, [activeLeague, page]);

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Trophy className="w-3.5 h-3.5" /> Rehearsal AI Hall of Fame
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-primary">
            Candidate Leaderboard
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Track your standing across separate Technical Coding and Behavioral HR leagues.
          </p>
        </div>

        {/* Dual League Switcher (Technical vs HR) */}
        <div className="max-w-xl mx-auto mb-6 bg-surface border border-border p-1.5 rounded-2xl flex items-center shadow-sm">
          <button
            type="button"
            onClick={() => {
              setActiveLeague('technical');
              setPage(1);
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeLeague === 'technical'
                ? 'bg-accent text-accent-foreground shadow-md'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Technical Round League</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveLeague('hr');
              setPage(1);
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeLeague === 'hr'
                ? 'bg-accent text-accent-foreground shadow-md'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>HR Behavioral League</span>
          </button>
        </div>

        {/* Informative League Info Card */}
        <div className="max-w-3xl mx-auto mb-8 rounded-xl bg-bg-subtle border border-border p-3.5 text-xs text-text-muted flex items-center gap-3">
          <Info className="w-4 h-4 text-accent flex-shrink-0" />
          <p className="leading-relaxed">
            {activeLeague === 'technical' ? (
              <>
                <strong>Technical League:</strong> Ranks elevate independently through algorithm correctness, Big-O optimality, and hidden test case accuracy.
              </>
            ) : (
              <>
                <strong>HR League:</strong> Ranks elevate independently through STAR protocol execution, communication clarity, and culture ownership.
              </>
            )}{' '}
            <em>(Resume review is an unranked interactive brainstorming tool).</em>
          </p>
        </div>

        {/* Leaderboard Table Container */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-subtle text-xs font-mono text-text-muted uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-20">Pos</th>
                  <th className="py-4 px-6">Candidate</th>
                  <th className="py-4 px-6">{activeLeague === 'technical' ? 'Tech Rank' : 'HR Rank'}</th>
                  <th className="py-4 px-6 text-right">League Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-text-subtle font-mono">
                      Loading {activeLeague === 'technical' ? 'Technical' : 'HR'} rankings...
                    </td>
                  </tr>
                ) : leaderboardData.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-text-subtle">
                      No candidates found on the leaderboard yet.
                    </td>
                  </tr>
                ) : (
                  leaderboardData.items.map((candidate) => {
                    const isTop1 = candidate.position === 1;
                    const isTop2 = candidate.position === 2;
                    const isTop3 = candidate.position === 3;

                    return (
                      <tr
                        key={candidate.userId}
                        className="hover:bg-surface-hover/70 transition-colors"
                      >
                        {/* Position */}
                        <td className="py-4 px-6 text-center font-mono font-bold">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-warning-subtle text-warning border border-warning/30 font-black">
                              1
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-text-subtle/20 text-text-primary font-black">
                              2
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent-subtle text-accent font-black">
                              3
                            </span>
                          ) : (
                            <span className="text-text-muted">#{candidate.position}</span>
                          )}
                        </td>

                        {/* Username */}
                        <td className="py-4 px-6 font-semibold text-text-primary">
                          <div className="flex items-center gap-2">
                            <span>{candidate.username}</span>
                            {isTop1 && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-warning-subtle text-warning border border-warning/20">
                                LEAGUE LEADER
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Rank Tier Badge */}
                        <td className="py-4 px-6">
                          <div className="inline-flex items-center gap-2">
                            <div className="relative w-5 h-5 flex-shrink-0">
                              <Image
                                src={candidate.rankBadge || '/ranks/bronze.svg'}
                                alt={candidate.rank}
                                fill
                                className="object-contain"
                              />
                            </div>
                            <span className="font-mono font-bold text-xs">
                              {candidate.rank}
                            </span>
                          </div>
                        </td>

                        {/* Rating Points */}
                        <td className="py-4 px-6 text-right font-mono font-black text-accent text-sm">
                          {candidate.points.toLocaleString()} {activeLeague === 'technical' ? 'Tech LP' : 'HR LP'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {leaderboardData.pagination.totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between bg-bg-subtle text-xs font-mono">
              <span className="text-text-muted">
                Page {leaderboardData.pagination.page} of {leaderboardData.pagination.totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={leaderboardData.pagination.page <= 1}
                  className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(leaderboardData.pagination.totalPages, p + 1))}
                  disabled={leaderboardData.pagination.page >= leaderboardData.pagination.totalPages}
                  className="p-1.5 rounded-lg border border-border bg-surface hover:bg-surface-hover disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
