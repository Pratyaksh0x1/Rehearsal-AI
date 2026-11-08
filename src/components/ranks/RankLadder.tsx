'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { RANK_ORDER, RANKS, RankTier } from '@/config/ranks';
import { Shield, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

interface RankLadderProps {
  currentRank?: RankTier;
  onContinue?: () => void;
  showContinueButton?: boolean;
}

export function RankLadder({
  currentRank = 'Bronze',
  onContinue,
  showContinueButton = true,
}: RankLadderProps) {
  const router = useRouter();
  const currentRankOrder = RANKS[currentRank]?.order ?? 1;

  const handleStart = () => {
    if (onContinue) {
      onContinue();
    } else {
      router.push('/home');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Rank Ladder Map */}
      <div className="relative w-full space-y-4 py-4">
        {RANK_ORDER.map((tier, index) => {
          const rank = RANKS[tier];
          const isCurrent = tier === currentRank;
          const isUnlocked = rank.order <= currentRankOrder;
          const isLocked = rank.order > currentRankOrder;

          return (
            <div
              key={tier}
              className={`relative rounded-xl border p-4 sm:p-5 transition-all flex items-center gap-4 sm:gap-6 ${
                isCurrent
                  ? 'border-accent bg-surface shadow-md ring-2 ring-accent/30'
                  : isUnlocked
                  ? 'border-border bg-surface/70'
                  : 'border-border/50 bg-bg-subtle/40 opacity-45 grayscale'
              }`}
            >
              {/* Vertical connector line */}
              {index < RANK_ORDER.length - 1 && (
                <div className="absolute left-[39px] sm:left-[43px] top-[74px] sm:top-[80px] w-0.5 h-6 bg-border -z-0" />
              )}

              {/* Badge Icon */}
              <div
                className={`relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-lg p-1 transition-transform ${
                  isCurrent ? 'scale-110 drop-shadow-lg' : ''
                }`}
              >
                <Image
                  src={rank.badgeUrl}
                  alt={rank.displayName}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Tier Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`font-bold text-base sm:text-lg ${
                      isCurrent ? 'text-accent' : 'text-text-primary'
                    }`}
                  >
                    {rank.displayName}
                  </h3>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-accent text-accent-foreground font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> CURRENT RANK
                    </span>
                  )}
                  {isLocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-bg text-text-subtle border border-border">
                      <Lock className="w-3 h-3" /> LOCKED
                    </span>
                  )}
                </div>

                {/* Rank Description */}
                <p
                  className={`text-xs sm:text-sm leading-relaxed ${
                    isCurrent
                      ? 'text-text-primary font-medium'
                      : 'text-text-muted'
                  }`}
                >
                  {rank.description}
                </p>

                {/* Points required display */}
                <div className="mt-2 text-xs font-mono text-text-subtle flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    Points Needed:{' '}
                    <strong className="text-text-muted">
                      {typeof rank.pointsRequired === 'number'
                        ? rank.pointsRequired
                        : 'TODO (TBD)'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start My Journey CTA Button */}
      {showContinueButton && (
        <div className="mt-8 text-center w-full">
          <button
            type="button"
            onClick={handleStart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-foreground font-bold text-base shadow-lg hover:shadow-accent/25 transition-all flex items-center justify-center gap-2.5 mx-auto"
          >
            <span>Start My Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

