'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2 } from 'lucide-react';
import { captureEvent } from '@/lib/analytics/posthog';
import { calculateRankFromPoints, RANKS } from '@/config/ranks';

interface HomePanelLeaderboardSectionProps {
  userPoints?: number;
  userName?: string;
}

interface LeaderboardUserItem {
  rank: number;
  name: string;
  points: string;
  badgeUrl: string;
  isCurrentUser?: boolean;
}

export function HomePanelLeaderboardSection({
  userPoints,
  userName,
}: HomePanelLeaderboardSectionProps) {
  // Panelists list matching Image 1
  const panelists = [
    {
      name: 'Arjun',
      tag: 'Warm-up',
      tagType: 'warmup',
      desc: 'Friendly and patient. A good first interview.',
      avatarUrl: '/avatars/arjun.jpg',
    },
    {
      name: 'Tanya',
      tag: 'Warm-up',
      tagType: 'warmup',
      desc: 'Brute force is fine to start. Hints when you stall.',
      avatarUrl: '/avatars/tanya.jpg',
    },
    {
      name: 'Samarth',
      tag: 'Real round',
      tagType: 'real',
      desc: 'A real company round. Wants specifics, not claims.',
      avatarUrl: '/avatars/samarth.jpg',
    },
    {
      name: 'Riddhi',
      tag: 'Real round',
      tagType: 'real',
      desc: 'Rigorous technical probe. Tests edge cases and scale.',
      avatarUrl: '/avatars/riddhi.jpg',
    },
    {
      name: 'Kaveri',
      tag: 'Warm-up',
      tagType: 'warmup',
      desc: 'Deconstructs problems step-by-step with encouraging guidance.',
      avatarUrl: '/avatars/kaveri.jpg',
    },
    {
      name: 'Pranav',
      tag: 'Real round',
      tagType: 'real',
      desc: 'A real company round. Tests concurrency and architectural intuition.',
      avatarUrl: '/avatars/pranav.jpg',
    },
  ];

  // Dynamic real leaderboard state
  const [topFive, setTopFive] = useState<LeaderboardUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRealLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard?league=overall&limit=5');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            setTopFive(
              data.items.map((item: any) => ({
                rank: item.position,
                name: item.username || 'Anonymous',
                points: Number(item.points || 0).toLocaleString(),
                badgeUrl: item.rankBadge || '/ranks/bronze.svg',
                isCurrentUser:
                  userName &&
                  item.username &&
                  userName.toLowerCase() === item.username.toLowerCase(),
              }))
            );
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load real leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRealLeaderboard();
  }, [userName]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {/* ================================================================= */}
        {/* LEFT CARD: Meet your panel                                        */}
        {/* ================================================================= */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all">
          <div>
            {/* Header */}
            <div className="space-y-2 mb-6">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary dark:text-white tracking-tight">
                Meet your panel
              </h2>
              <p className="text-sm text-text-muted leading-relaxed font-normal">
                Practice for the round that really counts. Your free interview is a Technical round,
                in any format.
              </p>
            </div>

            {/* Scrollable list of interviewers */}
            <div className="max-h-[380px] overflow-y-auto pr-1.5 space-y-3.5 custom-scrollbar">
              {panelists.map((panelist, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-bg-subtle border border-border hover:border-border-strong p-3.5 sm:p-4 transition-all duration-200 flex items-center gap-3.5 sm:gap-4 group hover:bg-surface-hover"
                >
                  {/* Circular Avatar */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-accent/30 shadow-sm">
                    <Image
                      src={panelist.avatarUrl}
                      alt={panelist.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm sm:text-base text-text-primary dark:text-white">
                        {panelist.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          panelist.tagType === 'warmup'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {panelist.tag}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate font-normal">
                      {panelist.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Link */}
          <div className="pt-6 border-t border-border dark:border-white/5 mt-4">
            <Link
              href="/interview"
              onClick={() => captureEvent('panel_start_interview_clicked')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-purple-600 dark:text-white/95 dark:hover:text-purple-300 transition-colors group"
            >
              <span>Start your first interview</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT CARD: Leaderboard                                           */}
        {/* ================================================================= */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-text-primary dark:text-white tracking-tight">
                Leaderboard
              </h2>
              <span className="text-xs font-mono text-text-subtle font-semibold uppercase tracking-wider">
                Top 5
              </span>
            </div>

            {/* Top 5 rows */}
            <div className="space-y-3.5">
              {isLoading && topFive.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-text-subtle font-mono text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                  <span>Loading real rankings...</span>
                </div>
              ) : topFive.length === 0 ? (
                <div className="py-8 text-center text-text-subtle font-mono text-xs">
                  No candidates ranked yet.
                </div>
              ) : (
                topFive.map((user) => (
                  <div
                    key={user.rank}
                    className={`flex items-center justify-between py-1.5 px-2 rounded-xl transition-colors ${
                      user.isCurrentUser
                        ? 'bg-accent-subtle/50 border border-accent/30'
                        : 'hover:bg-slate-100 dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Position Number (italic serif) */}
                      <span className="font-serif italic text-text-muted text-base w-4 text-center">
                        {user.rank}
                      </span>

                      {/* Rank Emblem Badge */}
                      <div className="relative w-8 h-8 flex-shrink-0 drop-shadow">
                        <Image
                          src={user.badgeUrl}
                          alt="Rank Badge"
                          fill
                          className="object-contain"
                        />
                      </div>

                      {/* Candidate Name */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm sm:text-base text-text-primary dark:text-white/95">
                          {user.name}
                        </span>
                        {user.isCurrentUser && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
                            YOU
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rating / Score */}
                    <span className="font-bold text-base sm:text-lg text-text-primary dark:text-white font-mono">
                      {user.points}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* YOU ARE HERE Card */}
            {userPoints !== undefined && userName !== undefined && (
              <div className="rounded-xl bg-accent-subtle border border-accent/20 p-3.5 sm:p-4 flex items-center justify-between shadow-sm mt-6">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-[10px] font-mono font-bold uppercase tracking-wider text-accent leading-tight">
                    <span>YOU ARE</span>
                    <span>HERE</span>
                  </div>

                  <div className="relative w-9 h-9 flex-shrink-0 drop-shadow">
                    <Image
                      src={RANKS[calculateRankFromPoints(userPoints)].badgeUrl}
                      alt={`${RANKS[calculateRankFromPoints(userPoints)].displayName} Rank`}
                      fill
                      className="object-contain"
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="font-bold text-base sm:text-lg text-text-primary">
                      {userName === 'Candidate' ? 'You' : userName}
                    </span>
                    <span className="text-[11px] font-mono text-text-subtle uppercase">
                      {RANKS[calculateRankFromPoints(userPoints)].displayName} Tier
                    </span>
                  </div>
                </div>

                <span className="font-bold text-lg sm:text-xl text-text-primary font-mono">
                  {userPoints} pts
                </span>
              </div>
            )}
          </div>

          {/* Bottom Action Link */}
          <div className="pt-6 border-t border-border dark:border-white/5 mt-4">
            <Link
              href="/leaderboard"
              onClick={() => captureEvent('home_see_leaderboard_clicked')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-purple-600 dark:text-white/95 dark:hover:text-purple-300 transition-colors group"
            >
              <span>See the leaderboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
