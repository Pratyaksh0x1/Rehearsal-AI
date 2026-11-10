'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mic, ArrowRight } from 'lucide-react';
import { captureEvent } from '@/lib/analytics/posthog';
import { getNextRankProgress, RANKS, RankTier } from '@/config/ranks';
import { AllRanksModal } from '@/components/ranks/AllRanksModal';

interface HomeHeroSectionProps {
  userRank?: string;
  points?: number;
  username?: string;
}

export function HomeHeroSection({
  userRank,
  points = 100,
}: HomeHeroSectionProps) {
  const [isRanksModalOpen, setIsRanksModalOpen] = useState(false);

  const currentPoints = typeof points === 'number' && !isNaN(points) ? points : 100;

  // Accurate dynamic rank calculation from unified ranks configuration
  const progressInfo = getNextRankProgress(currentPoints);
  const currentTier: RankTier = progressInfo.currentTier;
  const nextTier: RankTier | null = progressInfo.nextTier;

  const currentRankDef = RANKS[currentTier];
  const nextRankDef = nextTier ? RANKS[nextTier] : null;

  const pointsRemaining = progressInfo.pointsNeededForNext;
  const progressPercent = progressInfo.percentage;

  const shadowColor =
    currentTier === 'Bronze'
      ? 'rgba(180, 83, 9, 0.35)'
      : currentTier === 'Gold'
      ? 'rgba(245, 158, 11, 0.4)'
      : currentTier === 'Platinum'
      ? 'rgba(56, 189, 248, 0.4)'
      : currentTier === 'Diamond'
      ? 'rgba(6, 182, 212, 0.45)'
      : currentTier === 'Crown'
      ? 'rgba(168, 85, 247, 0.45)'
      : 'rgba(239, 68, 68, 0.5)';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headline, Voice Orb Waveform, CTA */}
        <div className="lg:col-span-7 space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-serif font-black tracking-tight text-text-primary leading-[1.14]">
            The moment you enter the environment,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent-hover to-accent">
              your interviewer is ready.
            </span>
          </h1>

          {/* Voice Waveform & Glowing Voice Orb */}
          <div className="flex items-center gap-4 py-2">
            {/* Glowing Orb */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-accent shadow-[0_0_24px_rgba(59,130,246,0.65)] flex items-center justify-center animate-pulse">
                <div className="w-4 h-4 rounded-full bg-white/90 blur-[1px]" />
              </div>
              <div className="absolute inset-0 rounded-full ring-4 ring-accent/30 animate-ping opacity-60" />
            </div>

            {/* Audio Waveform Bars */}
            <div className="flex items-center gap-1 sm:gap-1.5 h-10 px-2">
              {[
                16, 28, 42, 60, 35, 75, 48, 85, 30, 95, 55, 70, 40, 80, 50, 65, 38, 90, 44,
                72, 32, 58, 26, 45, 20, 34, 18, 12,
              ].map((height, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-accent transition-all duration-300"
                  style={{
                    height: `${height * 0.45}px`,
                    animation: `pulse-glow 2.2s ease-in-out infinite`,
                    animationDelay: `${(i % 6) * 180}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-xl font-normal">
            Practise every round of a real interview out loud, and hear exactly what to fix before
            the real one.
          </p>

          {/* Call to Action Row */}
          <div className="pt-2 flex items-center gap-4 flex-wrap">
            <Link
              href="/interview"
              onClick={() => captureEvent('hero_start_interview_clicked')}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-sm shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <Mic className="w-4 h-4 text-accent-foreground" />
              <span>Start interview</span>
            </Link>

            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-text-primary tracking-wide">
                Your free interview
              </span>
              <span className="text-xs text-text-muted">Technical, any format</span>
            </div>
          </div>
        </div>

        {/* Right Column: Pill & "Your rank" Card */}
        <div className="lg:col-span-5 flex flex-col items-start lg:items-end space-y-3">
          {/* Your Rank Card */}
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 sm:p-7 shadow-sm relative overflow-hidden transition-all">
            {/* Ambient Accent Background Glow */}
            <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-accent-subtle blur-3xl pointer-events-none" />

            {/* Top row: Official SVG Rank Badge + Info */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="relative w-20 h-20 sm:w-22 sm:h-22 flex-shrink-0"
                style={{ filter: `drop-shadow(0 10px 20px ${shadowColor})` }}
              >
                <Image
                  src={currentRankDef.badgeUrl}
                  alt={`${currentRankDef.displayName} Rank Emblem`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-subtle font-bold block">
                  Your rank
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wider text-text-primary">
                  {currentRankDef.displayName.toUpperCase()}
                </h2>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                  {currentRankDef.description}
                </p>
              </div>
            </div>

            {/* Points & Accurate Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-primary font-medium">
                  {nextRankDef ? (
                    `${pointsRemaining} points to ${nextRankDef.displayName}`
                  ) : (
                    'Maximum Rank Tier Achieved'
                  )}
                </span>
                <span className="text-text-subtle font-bold">
                  {currentPoints} / {nextRankDef ? (nextRankDef.pointsRequired as number) : (currentRankDef.pointsRequired as number)} pts
                </span>
              </div>

              {/* Progress Bar Track with Next Rank Icon */}
              <div className="relative flex items-center">
                <div className="w-full bg-surface-hover border border-border/50 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                {nextRankDef && (
                  <div className="absolute -right-1 -top-2 w-6 h-6 rounded-full overflow-hidden flex items-center justify-center opacity-90 drop-shadow">
                    <Image
                      src={nextRankDef.badgeUrl}
                      alt={`${nextRankDef.displayName} Rank Icon`}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Link: opens popup displaying all rank images */}
            <div className="pt-4 mt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsRanksModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors group cursor-pointer focus-ring rounded-md py-1"
              >
                <span>See all six ranks</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Modal displaying all six ranks */}
      <AllRanksModal
        isOpen={isRanksModalOpen}
        onClose={() => setIsRanksModalOpen(false)}
        currentRank={currentTier}
        points={currentPoints}
      />
    </section>
  );
}
