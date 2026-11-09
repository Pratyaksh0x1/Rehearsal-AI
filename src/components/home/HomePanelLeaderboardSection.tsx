'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { captureEvent } from '@/lib/analytics/posthog';

interface HomePanelLeaderboardSectionProps {
  userPoints?: number;
  userName?: string;
}

export function HomePanelLeaderboardSection({
  userPoints = 100,
  userName = 'You',
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

  // Leaderboard Top 5 matching Image 1
  const topFive = [
    {
      rank: 1,
      name: 'Ananya S.',
      points: '1,480',
      badgeUrl: '/ranks/crown.svg',
    },
    {
      rank: 2,
      name: 'Rohan I.',
      points: '1,215',
      badgeUrl: '/ranks/crown.svg',
    },
    {
      rank: 3,
      name: 'Priya N.',
      points: '940',
      badgeUrl: '/ranks/swords.svg',
    },
    {
      rank: 4,
      name: 'Suraj Gupta',
      points: '826',
      badgeUrl: '/ranks/swords.svg',
    },
    {
      rank: 5,
      name: 'Siddharth M.',
      points: '812',
      badgeUrl: '/ranks/swords.svg',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {/* ================================================================= */}
        {/* LEFT CARD: Meet your panel                                        */}
        {/* ================================================================= */}
        <div className="bg-[#131124]/90 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-2xl transition-all">
          <div>
            {/* Header */}
            <div className="space-y-2 mb-6">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
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
                  className="rounded-2xl bg-[#1d1b32]/85 border border-white/5 hover:border-purple-500/30 p-3.5 sm:p-4 transition-all duration-200 flex items-center gap-3.5 sm:gap-4 group hover:bg-[#23203c]"
                >
                  {/* Circular Avatar */}
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-purple-500/30 shadow-md">
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
                      <span className="font-bold text-sm sm:text-base text-white">
                        {panelist.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          panelist.tagType === 'warmup'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
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
          <div className="pt-6 border-t border-white/5 mt-4">
            <Link
              href="/interview"
              onClick={() => captureEvent('panel_start_interview_clicked')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/95 hover:text-purple-300 transition-colors group"
            >
              <span>Start your first interview</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT CARD: Leaderboard                                           */}
        {/* ================================================================= */}
        <div className="bg-[#131124]/90 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-2xl transition-all">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                Leaderboard
              </h2>
              <span className="text-xs font-mono text-text-subtle font-semibold uppercase tracking-wider">
                Top 5
              </span>
            </div>

            {/* Top 5 rows */}
            <div className="space-y-3.5">
              {topFive.map((user) => (
                <div
                  key={user.rank}
                  className="flex items-center justify-between py-1.5 px-2 hover:bg-white/[0.02] rounded-xl transition-colors"
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
                    <span className="font-medium text-sm sm:text-base text-white/95">
                      {user.name}
                    </span>
                  </div>

                  {/* Rating / Score */}
                  <span className="font-bold text-base sm:text-lg text-white font-mono">
                    {user.points}
                  </span>
                </div>
              ))}
            </div>

            {/* YOU ARE HERE Card */}
            <div className="rounded-2xl bg-gradient-to-r from-[#20183e] to-[#2b1b4b] border border-purple-500/40 p-3.5 sm:p-4 flex items-center justify-between shadow-[0_0_25px_rgba(168,85,247,0.18)] mt-6">
              <div className="flex items-center gap-3">
                {/* 2-line YOU ARE HERE tag */}
                <div className="flex flex-col text-[9px] font-mono font-black uppercase tracking-wider text-purple-300 leading-tight">
                  <span>YOU ARE</span>
                  <span>HERE</span>
                </div>

                {/* Current User Soldier / Bronze Emblem */}
                <div className="relative w-9 h-9 flex-shrink-0 drop-shadow">
                  <Image
                    src="/ranks/bronze.svg"
                    alt="Your Rank"
                    fill
                    className="object-contain"
                  />
                </div>

                {/* User Name */}
                <span className="font-bold text-base sm:text-lg text-white">
                  {userName === 'Candidate' ? 'You' : userName}
                </span>
              </div>

              {/* Current Points */}
              <span className="font-bold text-lg sm:text-xl text-white font-mono">
                {userPoints}
              </span>
            </div>
          </div>

          {/* Bottom Action Link */}
          <div className="pt-6 border-t border-white/5 mt-4">
            <Link
              href="/leaderboard"
              onClick={() => captureEvent('home_see_leaderboard_clicked')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/95 hover:text-purple-300 transition-colors group"
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

