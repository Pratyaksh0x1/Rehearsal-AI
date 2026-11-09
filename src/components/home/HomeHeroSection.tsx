'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mic, Sparkles, ArrowRight } from 'lucide-react';
import { captureEvent } from '@/lib/analytics/posthog';

interface HomeHeroSectionProps {
  userRank?: string;
  points?: number;
  username?: string;
}

export function HomeHeroSection({
  userRank = 'Soldier',
  points = 100,
}: HomeHeroSectionProps) {
  // Normalize rank naming: map Bronze -> Soldier, Gold -> Knight, etc.
  const rankDisplay =
    userRank.toLowerCase() === 'bronze'
      ? 'SOLDIER'
      : userRank.toLowerCase() === 'gold'
        ? 'KNIGHT'
        : userRank.toUpperCase();

  const nextRank =
    rankDisplay === 'SOLDIER'
      ? 'Knight'
      : rankDisplay === 'KNIGHT'
        ? 'Commander'
        : 'Next Rank';

  const currentPoints = points || 100;
  const targetPoints = rankDisplay === 'SOLDIER' ? 200 : currentPoints + 150;
  const pointsRemaining = Math.max(0, targetPoints - currentPoints);
  const progressPercent = Math.min(100, Math.round((currentPoints / targetPoints) * 100));

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Headline, Voice Orb Waveform, CTA */}
        <div className="lg:col-span-7 space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-serif font-black tracking-tight text-white leading-[1.14]">
            The moment you enter the environment,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-200 to-white">
              your interviewer is ready.
            </span>
          </h1>

          {/* Voice Waveform & Glowing Voice Orb */}
          <div className="flex items-center gap-4 py-2">
            {/* Glowing Orb */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-400 to-indigo-200 shadow-[0_0_24px_rgba(192,132,252,0.85)] flex items-center justify-center animate-pulse">
                <div className="w-4 h-4 rounded-full bg-white/90 blur-[1px]" />
              </div>
              <div className="absolute inset-0 rounded-full ring-4 ring-purple-400/30 animate-ping opacity-60" />
            </div>

            {/* Audio Waveform Bars */}
            <div className="flex items-center gap-1 sm:gap-1.5 h-10 px-2">
              {[
                16, 28, 42, 60, 35, 75, 48, 85, 30, 95, 55, 70, 40, 80, 50, 65, 38, 90, 44,
                72, 32, 58, 26, 45, 20, 34, 18, 12,
              ].map((height, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-purple-500/70 via-fuchsia-300 to-white transition-all duration-300"
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
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#d8b4fe] hover:bg-[#c084fc] text-neutral-950 font-bold text-sm shadow-[0_0_30px_rgba(216,180,254,0.4)] transition-all hover:scale-105 active:scale-95"
            >
              <Mic className="w-4 h-4 text-neutral-950" />
              <span>Start interview</span>
            </Link>

            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white tracking-wide">
                Your free interview
              </span>
              <span className="text-xs text-text-muted">Technical, any format</span>
            </div>
          </div>
        </div>

        {/* Right Column: 10,000+ Pill & "Your rank" Card */}
        <div className="lg:col-span-5 flex flex-col items-start lg:items-end space-y-3">
          {/* Top Pill Counter */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs text-purple-200 font-mono shadow-md">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span>10,000+ students practised</span>
          </div>

          {/* Your Rank Luxury Card */}
          <div className="w-full max-w-md bg-[#161426]/90 border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
            {/* Ambient Purple Background Glow */}
            <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

            {/* Top row: 3D Rank Shield + Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 flex-shrink-0 drop-shadow-[0_10px_20px_rgba(205,127,50,0.35)]">
                <Image
                  src="/ranks/bronze.svg"
                  alt="Soldier Rank Emblem"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-text-subtle font-bold block">
                  Your rank
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wider text-white">
                  {rankDisplay}
                </h2>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                  Fresh recruit. You know the basics; now learn to think out loud.
                </p>
              </div>
            </div>

            {/* Points & Progress Bar */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/90 font-medium">
                  {pointsRemaining} points to {nextRank}
                </span>
                <span className="text-text-subtle font-bold">
                  {currentPoints} / {targetPoints}
                </span>
              </div>

              {/* Progress Bar Track with Next Rank Icon */}
              <div className="relative flex items-center">
                <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-300 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(192,132,252,0.8)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="absolute -right-1 -top-2 w-6 h-6 rounded-full overflow-hidden flex items-center justify-center opacity-85">
                  <Image
                    src="/ranks/swords.svg"
                    alt="Next Rank Icon"
                    width={20}
                    height={20}
                    className="object-contain drop-shadow"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Link */}
            <div className="pt-4 mt-1">
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white transition-colors group"
              >
                <span>See all five ranks</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
