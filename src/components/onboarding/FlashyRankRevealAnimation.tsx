'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { Sparkles, ArrowRight, CheckCircle2, ChevronRight, TrendingUp, Trophy, Award } from 'lucide-react';
import { RANKS, RANK_ORDER, RankTier } from '@/config/ranks';

interface FlashyRankRevealAnimationProps {
  username?: string;
  assignedRank?: RankTier;
  onEnterArena: () => void;
}

export function FlashyRankRevealAnimation({
  username = 'Candidate',
  assignedRank = 'Bronze',
  onEnterArena,
}: FlashyRankRevealAnimationProps) {
  const [showContent, setShowContent] = useState(false);
  const currentDef = RANKS[assignedRank] || RANKS.Bronze;

  useEffect(() => {
    // Subtle, tasteful celebratory burst
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#3b82f6', '#10b981', '#6366f1'],
      disableForReducedMotion: true,
    });

    const timer = setTimeout(() => {
      setShowContent(true);
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto px-4 py-6 sm:py-10 flex flex-col items-center justify-center text-center font-sans">
      {/* Ambient Classic Glow */}
      <div className="absolute top-12 w-80 h-80 rounded-full bg-accent/10 blur-3xl pointer-events-none -z-10" />

      {/* Main Content Container */}
      <div
        className={`w-full flex flex-col items-center transition-all duration-700 transform ${
          showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-98'
        }`}
      >
        {/* Subtle Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-subtle border border-accent/20 text-accent font-mono text-xs uppercase tracking-wider font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Rank Calibrated</span>
        </div>

        {/* Compact, Classic Rank Emblem */}
        <div className="relative my-2">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 p-3 rounded-2xl bg-surface border-2 border-amber-500/30 shadow-lg shadow-amber-500/10 flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src={currentDef.badgeUrl}
                alt={`${currentDef.displayName} Rank`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          {/* Subtle outer accent ring */}
          <div className="absolute -inset-1 rounded-3xl border border-amber-500/20 pointer-events-none" />
        </div>

        {/* Rank Title & Persona */}
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-text-primary mt-3">
          {currentDef.displayName.toUpperCase()}
        </h1>

        <div className="text-xs font-mono font-medium text-warning tracking-wider uppercase mt-1">
          Tier I &bull; Baseline Standing
        </div>

        <p className="max-w-lg mx-auto text-xs sm:text-sm text-text-muted leading-relaxed font-normal mt-2.5 px-4">
          Welcome to Rehearsal AI, <strong className="text-text-primary font-semibold">{username}</strong>. Your starting profile is calibrated at <strong className="text-text-primary">{currentDef.displayName}</strong>.
        </p>

        {/* ================================================================= */}
        {/* THE FULL RANK LADDER: "You are here. Jump to these ranks." */}
        {/* ================================================================= */}
        <div className="w-full mt-8 p-5 sm:p-6 rounded-2xl bg-surface border border-border shadow-sm text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                <Trophy className="w-4 h-4 text-accent" />
                <span>Rank Advancement Ladder</span>
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                You are here. Perform well in technical interviews and optimize code complexity to jump to higher tiers.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success-subtle text-success text-xs font-mono font-semibold self-start sm:self-auto">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Jump up to 6 Tiers</span>
            </div>
          </div>

          {/* Rank Pathway Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            {RANK_ORDER.map((tierName, idx) => {
              const def = RANKS[tierName];
              const isCurrent = tierName === assignedRank;
              const isHigher = idx > RANK_ORDER.indexOf(assignedRank);

              return (
                <div
                  key={tierName}
                  className={`p-3 rounded-xl border transition-all flex flex-col justify-between relative ${
                    isCurrent
                      ? 'bg-accent-subtle/40 border-2 border-accent shadow-sm'
                      : isHigher
                      ? 'bg-bg-subtle/80 border-border hover:border-border-strong hover:bg-surface'
                      : 'bg-surface border-border opacity-70'
                  }`}
                >
                  {/* Current Rank Tag */}
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs whitespace-nowrap">
                      You are here
                    </div>
                  )}

                  {/* Badge & Tier info */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <Image
                        src={def.badgeUrl}
                        alt={def.displayName}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-text-primary truncate">
                        {def.displayName}
                      </h4>
                      <span className="text-[10px] font-mono text-text-muted block">
                        Tier {idx + 1}
                      </span>
                    </div>
                  </div>

                  {/* Points requirement & Jump status */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-text-subtle font-medium">
                      {def.pointsRequired} pts
                    </span>
                    {isCurrent ? (
                      <span className="text-accent font-semibold text-[10px]">Active</span>
                    ) : (
                      <span className="text-text-muted text-[10px] flex items-center gap-0.5">
                        <span>Jump</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Motivational Guide Callout */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-bg border border-border text-xs text-text-muted">
            <Award className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5">
              <span className="font-semibold text-text-primary">How rank advancement works:</span>
              <p className="leading-relaxed">
                Every mock interview assesses your algorithmic optimality, syntax fluency, code style, and explanation clarity. Higher performance earns rating points that automatically promote you through Gold, Platinum, Diamond, Crown, and Conqueror.
              </p>
            </div>
          </div>
        </div>

        {/* Classic Enter Arena CTA Button */}
        <div className="mt-7">
          <button
            type="button"
            onClick={onEnterArena}
            className="px-8 py-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-sm shadow-sm transition-all flex items-center gap-2 active:scale-95 group cursor-pointer focus-ring"
          >
            <span>Enter Rehearsal Arena</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
